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
