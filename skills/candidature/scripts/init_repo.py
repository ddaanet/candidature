"""Scaffolde un repo de données candidature et écrit la sentinelle de format.

Usage : python3 init_repo.py [chemin]
Sans argument, opère sur le répertoire courant. Idempotent : ne touche
aucun répertoire ni fichier déjà présent.
"""
import pathlib
import sys

FORMAT_VERSION = 1
GABARIT_MARKER = "<!-- candidature:gabarit -->"

_FICHE_CANDIDAT = f"""{GABARIT_MARKER}
# Fiche candidat

Gabarit non rempli. La phase profil du skill candidature remplit ce
fichier puis retire la première ligne marqueur.
"""

_TENDANCES = """# Tendances marché

Notes transversales sur le marché, à enrichir au fil des recherches.
"""

_A_TRIER = """# À trier

Prospects repérés mais pas encore qualifiés en candidature.
"""

_DIRS = ["candidatures", "sites", "recherches"]
_FILES = {
    "fiche-candidat.md": _FICHE_CANDIDAT,
    "tendances.md": _TENDANCES,
    "candidatures/_a-trier.md": _A_TRIER,
    ".candidature": f"format: {FORMAT_VERSION}\n",
}


def init_repo(root):
    """Crée la structure manquante sous root. Retourne les chemins créés."""
    base = pathlib.Path(root)
    created = []
    for d in _DIRS:
        target = base / d
        if not target.exists():
            target.mkdir(parents=True)
            created.append(d)
    for rel, content in _FILES.items():
        target = base / rel
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            created.append(rel)
    return created


def main(argv):
    root = argv[1] if len(argv) > 1 else "."
    created = init_repo(root)
    if created:
        print("Créé :")
        for rel in created:
            print(f"  {rel}")
    else:
        print("Rien à créer, le repo est déjà initialisé.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
