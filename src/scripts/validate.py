"""Valide les frontmatter des candidatures d'un repo de données.

Usage : python3 validate.py [chemin] [--today AAAA-MM-JJ]
Sans chemin, opère sur le répertoire courant. Signale les anomalies sans
corriger. Sort en code 1 si au moins une anomalie est trouvée, 0 sinon.
"""
import datetime
import pathlib
import re
import sys

STATUTS = {
    "à trier",
    "shortlist",
    "en attente",
    "refus",
    "classée sans suite",
    "écartée",
}

STATUTS_SOUMIS = {"en attente", "refus", "classée sans suite"}

_FOLDER_DATE = re.compile(r"^(\d{4}-\d{2}-\d{2})-")

REQUIS = ("entreprise", "poste", "statut")


def parse_frontmatter(text):
    """Retourne le dict du bloc frontmatter, ou None s'il n'y en a pas."""
    if not text.startswith("---"):
        return None
    lines = text.splitlines()
    if lines[0].strip() != "---":
        return None
    fm = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return fm
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        fm[key.strip()] = value.strip()
    return None


def _parse_date(value):
    try:
        return datetime.date.fromisoformat(value)
    except ValueError:
        return None


def validate_candidature(folder_name, fm, today):
    """Retourne la liste des anomalies d'une candidature."""
    anomalies = []
    for cle in REQUIS:
        if not fm.get(cle):
            anomalies.append(f"clé requise absente ou vide : {cle}")

    statut = fm.get("statut", "")
    if statut and statut not in STATUTS:
        anomalies.append(f"statut hors ensemble : {statut!r}")

    if statut in STATUTS_SOUMIS:
        if not fm.get("canal"):
            anomalies.append(f"canal requis pour le statut {statut!r}")
        if not fm.get("date_soumission"):
            anomalies.append(f"date_soumission requise pour le statut {statut!r}")
    if statut == "refus" and not fm.get("date_reponse"):
        anomalies.append("date_reponse requise pour le statut 'refus'")

    dates = {}
    for cle in ("date_shortlist", "date_soumission", "date_reponse"):
        brut = fm.get(cle)
        if not brut:
            continue
        d = _parse_date(brut)
        if d is None:
            anomalies.append(f"{cle} au format invalide : {brut!r}, attendu AAAA-MM-JJ")
        else:
            dates[cle] = d

    soumission = dates.get("date_soumission")
    if soumission and soumission > today:
        anomalies.append(f"date_soumission dans le futur : {soumission.isoformat()}")

    attendue = soumission or dates.get("date_shortlist")
    m = _FOLDER_DATE.match(folder_name)
    if attendue and m and m.group(1) != attendue.isoformat():
        anomalies.append(
            f"date du dossier {m.group(1)} incohérente avec {attendue.isoformat()}"
        )

    reponse = dates.get("date_reponse")
    if soumission and reponse and reponse < soumission:
        anomalies.append("date_reponse antérieure à date_soumission")

    shortlist = dates.get("date_shortlist")
    if soumission and shortlist and shortlist > soumission:
        anomalies.append("date_shortlist postérieure à date_soumission")

    return anomalies


def scan(root, today):
    """Parcourt candidatures/*/README.md. Retourne les dossiers fautifs."""
    base = pathlib.Path(root)
    rapport = {}
    candidatures = base / "candidatures"
    if not candidatures.is_dir():
        return rapport
    for readme in sorted(candidatures.glob("*/README.md")):
        dossier = readme.parent.name
        fm = parse_frontmatter(readme.read_text(encoding="utf-8"))
        if fm is None:
            rapport[dossier] = ["frontmatter absent ou mal formé"]
            continue
        anomalies = validate_candidature(dossier, fm, today)
        if anomalies:
            rapport[dossier] = anomalies
    return rapport


def main(argv):
    today = datetime.date.today()
    positionnels = []
    i = 1
    while i < len(argv):
        a = argv[i]
        if a == "--today":
            if i + 1 >= len(argv):
                print("--today requiert une valeur AAAA-MM-JJ", file=sys.stderr)
                return 2
            valeur = argv[i + 1]
            parsee = _parse_date(valeur)
            if parsee is None:
                print(
                    f"--today invalide : {valeur!r}, attendu AAAA-MM-JJ",
                    file=sys.stderr,
                )
                return 2
            today = parsee
            i += 2
            continue
        if a.startswith("--"):
            print(f"option inconnue : {a}", file=sys.stderr)
            return 2
        positionnels.append(a)
        i += 1
    root = positionnels[0] if positionnels else "."
    rapport = scan(root, today)
    if not rapport:
        print("Métadonnées de candidature conformes.")
        return 0
    print("Anomalies de métadonnées :")
    for dossier in sorted(rapport):
        print(f"  {dossier}")
        for a in rapport[dossier]:
            print(f"    - {a}")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
