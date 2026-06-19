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


if __name__ == "__main__":
    unittest.main()
