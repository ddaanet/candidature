# src/scripts/dispatch.py
"""Reducer de contrôle de flux du skill candidature.

Le flux de contrôle vit ici, pas dans l'agent. Sous-commandes status, next,
capture-form, transition. Chaque sous-commande imprime du markdown que l'agent
lit et suit. Le JSON ne sert qu'en entrée complexe (capture-form --fields).
"""
import json
import pathlib
import re

import validate

_FORMAT = re.compile(r"^format:\s*(\d+)", re.MULTILINE)


def derive_repo_status(sentinel_text, has_candidatures):
    """État du repo à partir de la sentinelle et de la présence de candidatures/."""
    if sentinel_text is None:
        return ("adopt" if has_candidatures else "uninitialized", None)
    m = _FORMAT.search(sentinel_text)
    version = int(m.group(1)) if m else 1
    if version == 1:
        return ("ready", 1)
    return ("too-new", version)


def route(intent, state):
    """Action de routage à partir de l'intention et de l'état dérivé du repo."""
    status = state["repo_status"]
    if status != "ready":
        if status == "too-new":
            return {"action": "update_skill"}
        return {"action": "init", "proposal": "create" if status == "uninitialized" else "adopt"}
    if intent == "feedback":
        return {"action": "load_phase", "phase": "suivi", "file": "references/suivi.md"}
    if state["fiche"] in ("gabarit", "absent"):
        return {"action": "load_phase", "phase": "profil", "file": "references/profil.md"}
    if intent == "offer":
        return {"action": "load_phase", "phase": "preparation", "file": "references/preparation.md"}
    if intent == "submit":
        if not state["slug_known"]:
            return {"refused": True, "reason": "slug inconnu"}
        if not state["form_captured"]:
            return {"action": "capture_form", "phase": "soumission",
                    "file": "references/soumission.md", "step": "explore_form"}
        return {"action": "load_phase", "phase": "soumission",
                "file": "references/soumission.md", "step": "generate"}
    return {"action": "load_phase", "phase": "preparation", "file": "references/preparation.md"}


def validate_transition(target, fm):
    """Légalité d'une transition de statut, ensemble fermé et clés requises."""
    if target not in validate.STATUTS:
        return (False, f"statut hors ensemble : {target!r}")
    if target in validate.STATUTS_SOUMIS:
        if not fm.get("canal"):
            return (False, f"canal requis pour le statut {target!r}")
        if not fm.get("date_soumission"):
            return (False, f"date_soumission requise pour le statut {target!r}")
    if target == "refus" and not fm.get("date_reponse"):
        return (False, "date_reponse requise pour le statut 'refus'")
    return (True, None)


GABARIT = "<!-- candidature:gabarit -->"


def read_fiche_status(root):
    fiche = pathlib.Path(root) / "fiche-candidat.md"
    if not fiche.is_file():
        return "absent"
    first = fiche.read_text(encoding="utf-8").splitlines()[:1]
    return "gabarit" if first and first[0].strip() == GABARIT else "rempli"


def read_dossier(root, slug):
    readme = pathlib.Path(root) / "candidatures" / slug / "README.md"
    if not readme.is_file():
        return None
    return validate.parse_frontmatter(readme.read_text(encoding="utf-8"))


def form_captured(fm):
    return bool(fm and fm.get("formulaire"))


def load_form(fm):
    raw = (fm or {}).get("formulaire")
    return json.loads(raw) if raw else []


def set_frontmatter_key(text, key, value):
    """Remplace ou insère key: value dans le bloc frontmatter de tête."""
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise ValueError("frontmatter de tête absent")
    close = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    newline = f"{key}: {value}\n"
    for i in range(1, close):
        if lines[i].split(":", 1)[0].strip() == key:
            lines[i] = newline
            return "".join(lines)
    lines.insert(close, newline)
    return "".join(lines)


import argparse
import datetime
import sys


def render_action(action, form=None):
    if action.get("refused"):
        return f"## Refusé\n\n{action['reason']}.\n"
    kind = action["action"]
    if kind == "update_skill":
        return "## Action : mettre à jour le skill\n\nLe repo utilise un format plus récent que ce skill.\n"
    if kind == "init":
        return f"## Action : initialiser le repo\n\nProposition : {action['proposal']}.\n"
    if kind == "capture_form":
        return (f"## Action : charger une phase\n\nCharger `{action['file']}`.\n"
                "Étape : explorer le formulaire et capturer ses champs avant toute rédaction.\n")
    body = f"## Action : charger une phase\n\nCharger `{action['file']}`.\n"
    if action.get("step") == "generate":
        body += "Étape : rédaction, le formulaire est capturé.\n\nChamps du formulaire.\n\n"
        for f in form or []:
            body += f"- {f['libelle']} ({f['type']}, {f['taille']})\n"
    return body


def index_rows(root):
    rows = []
    base = pathlib.Path(root) / "candidatures"
    if not base.is_dir():
        return rows
    for readme in sorted(base.glob("*/README.md")):
        fm = validate.parse_frontmatter(readme.read_text(encoding="utf-8")) or {}
        rows.append({"slug": readme.parent.name, "entreprise": fm.get("entreprise", ""),
                     "poste": fm.get("poste", ""), "statut": fm.get("statut", ""),
                     "canal": fm.get("canal", "")})
    return rows


def render_status(repo_status, version, rows, anomalies):
    label = {"ready": f"prêt (format {version})", "uninitialized": "non initialisé",
             "adopt": "à adopter", "too-new": "format trop récent"}[repo_status]
    md = [f"## Repo : {label}", ""]
    if rows:
        md += ["| slug | entreprise | poste | statut | canal |",
               "|------|------------|-------|--------|-------|"]
        for r in rows:
            md.append(f"| {r['slug']} | {r['entreprise']} | {r['poste']} | {r['statut']} | {r['canal'] or '—'} |")
        md.append("")
    if anomalies:
        md.append("Anomalies de métadonnées.")
        for dossier in sorted(anomalies):
            md.append(f"- {dossier} : {', '.join(anomalies[dossier])}")
    else:
        md.append("Aucune anomalie.")
    return "\n".join(md) + "\n"


def _derive_state(root, slug):
    sentinel = pathlib.Path(root) / ".candidature"
    text = sentinel.read_text(encoding="utf-8") if sentinel.is_file() else None
    has_cand = (pathlib.Path(root) / "candidatures").is_dir()
    repo_status, _ = derive_repo_status(text, has_cand)
    fm = read_dossier(root, slug) if slug else None
    return {"repo_status": repo_status, "fiche": read_fiche_status(root),
            "slug_known": fm is not None, "form_captured": form_captured(fm)}, fm


def main(argv):
    p = argparse.ArgumentParser(prog="dispatch.py")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("status")
    s.add_argument("--root", default=".")
    n = sub.add_parser("next")
    n.add_argument("--root", default=".")
    n.add_argument("--intent", required=True)
    n.add_argument("--slug")
    c = sub.add_parser("capture-form")
    c.add_argument("--root", default=".")
    c.add_argument("--slug", required=True)
    c.add_argument("--fields", required=True)
    t = sub.add_parser("transition")
    t.add_argument("--root", default=".")
    t.add_argument("--slug", required=True)
    t.add_argument("--to", required=True)
    t.add_argument("--canal")
    t.add_argument("--date-soumission")
    a = p.parse_args(argv)

    if a.cmd == "status":
        sentinel = pathlib.Path(a.root) / ".candidature"
        text = sentinel.read_text(encoding="utf-8") if sentinel.is_file() else None
        repo_status, version = derive_repo_status(text, (pathlib.Path(a.root) / "candidatures").is_dir())
        anomalies = validate.scan(a.root, datetime.date.today())
        print(render_status(repo_status, version, index_rows(a.root), anomalies))
        return 0

    if a.cmd == "next":
        state, fm = _derive_state(a.root, a.slug)
        action = route(a.intent, state)
        print(render_action(action, form=load_form(fm)))
        return 0

    if a.cmd == "capture-form":
        readme = pathlib.Path(a.root) / "candidatures" / a.slug / "README.md"
        fields = json.loads(a.fields)
        text = set_frontmatter_key(readme.read_text(encoding="utf-8"), "formulaire",
                                   json.dumps(fields, ensure_ascii=False))
        readme.write_text(text, encoding="utf-8")
        print(f"## Formulaire capturé\n\n{a.slug}, {len(fields)} champ(s) enregistré(s).\n")
        return 0

    if a.cmd == "transition":
        readme = pathlib.Path(a.root) / "candidatures" / a.slug / "README.md"
        text = readme.read_text(encoding="utf-8")
        fm = dict(validate.parse_frontmatter(text) or {})
        if a.canal:
            fm["canal"] = a.canal
        if a.date_soumission:
            fm["date_soumission"] = a.date_soumission
        ok, reason = validate_transition(a.to, fm)
        if not ok:
            print(f"## Transition refusée\n\n{reason}.\n")
            return 1
        text = set_frontmatter_key(text, "statut", a.to)
        if a.canal:
            text = set_frontmatter_key(text, "canal", a.canal)
        if a.date_soumission:
            text = set_frontmatter_key(text, "date_soumission", a.date_soumission)
        readme.write_text(text, encoding="utf-8")
        print(f"## Transition appliquée\n\nstatut : {a.to}.\n")
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
