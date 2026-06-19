# Phase 2 — Outillage de bootstrap et validation — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fournir les deux scripts Python que le skill candidature appellera pour initialiser un repo de données et valider les métadonnées de candidature.

**Architecture:** Deux scripts stdlib autonomes sous src/scripts/. init_repo.py scaffolde la structure du repo de données et écrit la sentinelle .candidature versionnée. validate.py lit les frontmatter des README de candidature, signale les anomalies, sort en code non nul si une anomalie est trouvée. Aucune dépendance externe : parsing frontmatter maison, tests en unittest stdlib. Les deux scripts sont indépendants l'un de l'autre et peuvent se construire en parallèle.

**Tech Stack:** Python 3 stdlib uniquement. Tests via unittest. Pas de pyyaml, pas de pytest.

## Global Constraints

- Stdlib Python uniquement. Aucune dépendance externe (pas de pyyaml ni pytest). Le skill cible une installation minimale.
- Version de format du stockage : 1. Constante FORMAT_VERSION = 1 dans init_repo.py.
- Ensemble fermé des statuts, valeurs exactes avec accents : à trier, shortlist, en attente, refus, classée sans suite, écartée.
- Marqueur de gabarit non rempli : la chaîne exacte `<!-- candidature:gabarit -->`. init_repo.py l'écrit en tête de fiche-candidat.md, le dispatcher du Plan B le lira pour router vers la phase profil.
- Les tests sont déterministes : la date du jour est injectable (argument today), jamais lue implicitement dans un test.
- Tests lancés depuis la racine du repo : `python3 -m unittest discover -s tests`.
- Ce plan ne touche pas SKILL.md, DESIGN.md ni references/. La contrainte de modèle Opus de ces fichiers ne s'applique pas ici. Ce plan peut s'exécuter sur n'importe quel modèle.

---

## File Structure

- `src/scripts/init_repo.py` — scaffolding du repo de données, écriture de la sentinelle. Responsabilité unique : créer une structure vide idempotente.
- `src/scripts/validate.py` — validation des frontmatter de candidature. Trois unités internes construites dans une seule tâche : parser de frontmatter, logique de validation pure sur dict, CLI de parcours de répertoire.
- `tests/test_init_repo.py` — tests de init_repo.py.
- `tests/test_validate.py` — tests de validate.py.

Les tests vivent sous tests/ hors de src/, pour ne pas finir copiés dans l'artefact par le build du Plan B.

Deux tâches, une par fichier livrable. init_repo.py et validate.py sont indépendants : un relecteur peut rejeter l'un en approuvant l'autre, et ils n'ont aucune dépendance de code entre eux.

---

## Task 1: Sentinelle et scaffolding (init_repo.py)

**Files:**
- Create: `src/scripts/init_repo.py`
- Test: `tests/test_init_repo.py`

**Interfaces:**
- Produces: constante `FORMAT_VERSION = 1`. Constante `GABARIT_MARKER = "<!-- candidature:gabarit -->"`. Fonction `init_repo(root: str) -> list[str]` qui retourne la liste des chemins relatifs créés (vide si tout existait déjà). Fonction `main(argv: list[str]) -> int`. Le Plan B consomme FORMAT_VERSION (lecture de .candidature) et GABARIT_MARKER (détection de fiche-candidat.md non rempli).

- [ ] **Step 1: Écrire le test de création initiale**

```python
# tests/test_init_repo.py
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src" / "scripts"))
import init_repo


class InitRepoTest(unittest.TestCase):
    def test_cree_structure_complete(self):
        with tempfile.TemporaryDirectory() as d:
            created = init_repo.init_repo(d)
            root = pathlib.Path(d)
            self.assertTrue((root / "candidatures").is_dir())
            self.assertTrue((root / "sites").is_dir())
            self.assertTrue((root / "recherches").is_dir())
            self.assertTrue((root / "fiche-candidat.md").is_file())
            self.assertTrue((root / "tendances.md").is_file())
            self.assertTrue((root / "candidatures" / "_a-trier.md").is_file())
            self.assertTrue((root / ".candidature").is_file())
            self.assertIn(".candidature", created)

    def test_sentinelle_porte_la_version(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            text = (pathlib.Path(d) / ".candidature").read_text(encoding="utf-8")
            self.assertEqual(text.strip(), "format: 1")

    def test_fiche_candidat_porte_le_marqueur_gabarit(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            text = (pathlib.Path(d) / "fiche-candidat.md").read_text(encoding="utf-8")
            self.assertIn(init_repo.GABARIT_MARKER, text)

    def test_idempotent_ne_recree_rien(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            second = init_repo.init_repo(d)
            self.assertEqual(second, [])

    def test_idempotent_ne_modifie_pas_le_contenu(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            fiche = pathlib.Path(d) / "fiche-candidat.md"
            fiche.write_text("profil rempli", encoding="utf-8")
            init_repo.init_repo(d)
            self.assertEqual(fiche.read_text(encoding="utf-8"), "profil rempli")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `python3 -m unittest tests.test_init_repo -v`
Expected: FAIL avec `ModuleNotFoundError: No module named 'init_repo'`.

- [ ] **Step 3: Écrire init_repo.py**

```python
# src/scripts/init_repo.py
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
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `python3 -m unittest tests.test_init_repo -v`
Expected: PASS pour les cinq tests. Note : les deux tests d'idempotence sont des tests de caractérisation, l'implémentation les satisfait d'emblée par le garde `if not target.exists()`.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/init_repo.py tests/test_init_repo.py
git commit -m "✨ script d'init du repo de données et sentinelle de format"
```

---

## Task 2: Validateur de candidatures (validate.py)

Un seul fichier, un seul sous-agent, une seule porte de revue. Le fichier se construit en trois unités internes (parser, logique de validation, CLI), chacune en cycle TDD rouge-vert, avec un commit par unité pour des commits fréquents. La revue se fait à la fin de la tâche.

**Files:**
- Create: `src/scripts/validate.py`
- Test: `tests/test_validate.py`

**Interfaces:**
- Produces (contrat consommé par le dispatcher du Plan B) : la CLI `python3 scripts/validate.py [chemin] [--today AAAA-MM-JJ]`. Sans chemin, opère sur le répertoire courant. Imprime un rapport lisible. Sort en code 1 si au moins une anomalie est trouvée, 0 sinon. Constante `STATUTS` (ensemble fermé des statuts valides).

### Unité 1 : parser de frontmatter

- [ ] **Step 1: Écrire les tests du parser**

```python
# tests/test_validate.py
import datetime
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src" / "scripts"))
import validate


class ParseFrontmatterTest(unittest.TestCase):
    def test_parse_paires_simples(self):
        text = "---\nentreprise: Mirakl\nstatut: refus\n---\n\nCorps.\n"
        fm = validate.parse_frontmatter(text)
        self.assertEqual(fm["entreprise"], "Mirakl")
        self.assertEqual(fm["statut"], "refus")

    def test_pas_de_frontmatter_retourne_none(self):
        self.assertIsNone(validate.parse_frontmatter("# Titre\n\nCorps sans frontmatter.\n"))

    def test_valeur_avec_deux_points(self):
        text = "---\nposte: Ingénieur : backend\n---\n"
        fm = validate.parse_frontmatter(text)
        self.assertEqual(fm["poste"], "Ingénieur : backend")

    def test_valeurs_vides_conservees(self):
        text = "---\ncanal:\n---\n"
        fm = validate.parse_frontmatter(text)
        self.assertEqual(fm["canal"], "")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `python3 -m unittest tests.test_validate -v`
Expected: FAIL avec `ModuleNotFoundError: No module named 'validate'`.

- [ ] **Step 3: Écrire validate.py avec parse_frontmatter**

```python
# src/scripts/validate.py
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
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `python3 -m unittest tests.test_validate -v`
Expected: PASS pour les quatre tests du parser.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/validate.py tests/test_validate.py
git commit -m "✨ parser de frontmatter pour le validateur de candidatures"
```

### Unité 2 : logique de validation

- [ ] **Step 6: Écrire les tests de validation des clés et du statut**

```python
class ValidateCandidatureTest(unittest.TestCase):
    TODAY = datetime.date(2026, 6, 19)

    def valid_fm(self):
        return {
            "entreprise": "Mirakl",
            "poste": "Senior AI Engineer",
            "statut": "refus",
            "canal": "Greenhouse",
            "date_soumission": "2026-04-09",
            "date_reponse": "2026-04-13",
        }

    def test_candidature_conforme_sans_anomalie(self):
        anomalies = validate.validate_candidature("2026-04-09-mirakl", self.valid_fm(), self.TODAY)
        self.assertEqual(anomalies, [])

    def test_cle_requise_manquante(self):
        fm = self.valid_fm()
        del fm["poste"]
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        self.assertTrue(any("poste" in a for a in anomalies))

    def test_statut_hors_enum(self):
        fm = self.valid_fm()
        fm["statut"] = "rejeté"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        self.assertTrue(any("statut" in a for a in anomalies))

    def test_statut_a_trier_sans_canal_ni_date_conforme(self):
        fm = {"entreprise": "X", "poste": "Y", "statut": "à trier"}
        anomalies = validate.validate_candidature("2026-06-19-x", fm, self.TODAY)
        self.assertEqual(anomalies, [])
```

- [ ] **Step 7: Lancer les tests, vérifier qu'ils échouent**

Run: `python3 -m unittest tests.test_validate.ValidateCandidatureTest -v`
Expected: FAIL avec `AttributeError: module 'validate' has no attribute 'validate_candidature'`.

- [ ] **Step 8: Ajouter validate_candidature à validate.py (clés, statut, présence conditionnelle)**

```python
REQUIS = ("entreprise", "poste", "statut")


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

    return anomalies
```

- [ ] **Step 9: Lancer les tests, vérifier qu'ils passent**

Run: `python3 -m unittest tests.test_validate.ValidateCandidatureTest -v`
Expected: PASS pour les quatre tests.

- [ ] **Step 10: Écrire les tests de plausibilité des dates**

```python
    def test_date_non_parsable(self):
        fm = self.valid_fm()
        fm["date_soumission"] = "09/04/2026"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        self.assertTrue(any("date_soumission" in a and "format" in a for a in anomalies))

    def test_date_soumission_dans_le_futur(self):
        fm = self.valid_fm()
        fm["date_soumission"] = "2026-12-31"
        fm["date_reponse"] = "2027-01-05"
        anomalies = validate.validate_candidature("2026-12-31-mirakl", fm, self.TODAY)
        self.assertTrue(any("futur" in a for a in anomalies))

    def test_date_dossier_incoherente(self):
        fm = self.valid_fm()
        anomalies = validate.validate_candidature("2026-04-01-mirakl", fm, self.TODAY)
        self.assertTrue(any("dossier" in a for a in anomalies))

    def test_date_reponse_avant_soumission(self):
        fm = self.valid_fm()
        fm["date_reponse"] = "2026-04-01"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        self.assertTrue(any("date_reponse" in a and "antérieure" in a for a in anomalies))

    def test_date_shortlist_apres_soumission(self):
        fm = self.valid_fm()
        fm["date_shortlist"] = "2026-04-20"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        self.assertTrue(any("date_shortlist" in a for a in anomalies))
```

- [ ] **Step 11: Lancer les tests, vérifier qu'ils échouent**

Run: `python3 -m unittest tests.test_validate.ValidateCandidatureTest -v`
Expected: FAIL sur les cinq nouveaux tests (les contrôles de date n'existent pas encore).

- [ ] **Step 12: Ajouter les contrôles de date à validate_candidature**

Insérer ce bloc dans `validate_candidature`, juste avant `return anomalies` :

```python
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
```

- [ ] **Step 13: Lancer tous les tests de validation, vérifier qu'ils passent**

Run: `python3 -m unittest tests.test_validate -v`
Expected: PASS pour les tests du parser et tous les tests de validate_candidature.

- [ ] **Step 14: Commit**

```bash
git add src/scripts/validate.py tests/test_validate.py
git commit -m "✨ logique de validation des métadonnées de candidature"
```

### Unité 3 : CLI de parcours

- [ ] **Step 15: Écrire les tests du scan sur répertoire temporaire**

```python
class ScanTest(unittest.TestCase):
    TODAY = datetime.date(2026, 6, 19)

    def _ecrire(self, base, dossier, frontmatter):
        d = pathlib.Path(base) / "candidatures" / dossier
        d.mkdir(parents=True)
        (d / "README.md").write_text(f"---\n{frontmatter}---\n\nCorps.\n", encoding="utf-8")

    def test_scan_repere_anomalie(self):
        with tempfile.TemporaryDirectory() as base:
            self._ecrire(base, "2026-04-09-mirakl", "entreprise: Mirakl\nposte: X\nstatut: rejeté\n")
            result = validate.scan(base, self.TODAY)
            self.assertIn("2026-04-09-mirakl", result)

    def test_scan_silencieux_si_conforme(self):
        with tempfile.TemporaryDirectory() as base:
            self._ecrire(
                base,
                "2026-06-19-x",
                "entreprise: X\nposte: Y\nstatut: à trier\n",
            )
            result = validate.scan(base, self.TODAY)
            self.assertEqual(result, {})

    def test_scan_ignore_a_trier_fichier(self):
        with tempfile.TemporaryDirectory() as base:
            (pathlib.Path(base) / "candidatures").mkdir(parents=True)
            (pathlib.Path(base) / "candidatures" / "_a-trier.md").write_text("# À trier\n", encoding="utf-8")
            result = validate.scan(base, self.TODAY)
            self.assertEqual(result, {})

    def test_readme_sans_frontmatter_signale(self):
        with tempfile.TemporaryDirectory() as base:
            d = pathlib.Path(base) / "candidatures" / "2026-04-09-mirakl"
            d.mkdir(parents=True)
            (d / "README.md").write_text("# Pas de frontmatter\n", encoding="utf-8")
            result = validate.scan(base, self.TODAY)
            self.assertIn("2026-04-09-mirakl", result)
            self.assertTrue(any("frontmatter" in a for a in result["2026-04-09-mirakl"]))
```

- [ ] **Step 16: Lancer les tests, vérifier qu'ils échouent**

Run: `python3 -m unittest tests.test_validate.ScanTest -v`
Expected: FAIL avec `AttributeError: module 'validate' has no attribute 'scan'`.

- [ ] **Step 17: Ajouter scan et main à validate.py**

```python
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
        if a == "--today" and i + 1 < len(argv):
            today = datetime.date.fromisoformat(argv[i + 1])
            i += 2
            continue
        if not a.startswith("--"):
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
```

- [ ] **Step 18: Lancer les tests, vérifier qu'ils passent**

Run: `python3 -m unittest tests.test_validate.ScanTest -v`
Expected: PASS pour les quatre tests de scan.

- [ ] **Step 19: Vérifier le validateur sur les données réelles du repo Emploi**

Run: `python3 src/scripts/validate.py /Users/david/code/Emploi --today 2026-06-19; echo "code de sortie : $?"`
Expected: un rapport lisible. Les anomalies éventuelles sur les données migrées sont attendues (statuts hérités, dates manquantes). Noter le code de sortie. Cette étape vérifie le comportement réel, elle ne modifie pas les données. Si le rapport révèle un faux positif systématique (une règle trop stricte contre les données réelles), corriger la règle dans validate_candidature et relancer les tests de l'unité 2 avant de continuer.

- [ ] **Step 20: Lancer toute la suite de tests**

Run: `python3 -m unittest discover -s tests -v`
Expected: PASS pour tous les tests de init_repo et validate.

- [ ] **Step 21: Commit**

```bash
git add src/scripts/validate.py tests/test_validate.py
git commit -m "✨ CLI de parcours et rapport du validateur de candidatures"
```

---

## Self-Review

Couverture de la spec, section par section :

- Sentinelle .candidature versionnée : tâche 1, FORMAT_VERSION et écriture testées.
- Script d'init idempotent qui scaffolde la structure : tâche 1, tests de création et d'idempotence.
- Marqueur de gabarit non rempli de fiche-candidat.md : tâche 1, GABARIT_MARKER écrit et testé. Le dispatcher du Plan B le consomme.
- Validateur des clés requises : tâche 2, unité 2.
- Validateur du statut dans l'ensemble fermé : tâche 2, enum STATUTS.
- Validateur des dates parsables et plausibles : tâche 2, unité 2, format, futur, cohérence dossier, ordre des dates.
- Présence conditionnelle canal/date selon statut : tâche 2, unité 2.
- Rapport et code de sortie non nul, utilisable seul : tâche 2, unité 3, main et scan.
- Lancé par le dispatcher à la lecture de l'index : contrat CLI exposé, le câblage dispatcher est du Plan B.

Hors de ce plan, conformément au découpage : dispatcher SKILL.md, réécriture des fichiers de phase, effondrement du build, DESIGN.md, harnais LinkedIn.

Cohérence des types : `init_repo(root) -> list[str]`, `parse_frontmatter(text) -> dict | None`, `validate_candidature(folder_name, fm, today) -> list[str]`, `scan(root, today) -> dict`, `main(argv) -> int`. Les noms et signatures sont stables. STATUTS, STATUTS_SOUMIS, REQUIS, FORMAT_VERSION, GABARIT_MARKER définis une fois et référencés tels quels.

Granularité : deux tâches, une par fichier livrable, chacune rejetable indépendamment. validate.py reste une seule tâche malgré ses trois unités internes, parce qu'un relecteur ne rejette pas le parser indépendamment du validateur qu'il alimente. Les unités gardent leur cycle TDD et un commit chacune, la porte de revue est en fin de tâche.

Pas de placeholder : chaque étape de code porte le code réel, chaque étape de test porte la commande exacte et le résultat attendu.
