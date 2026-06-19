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
