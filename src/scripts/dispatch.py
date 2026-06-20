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
