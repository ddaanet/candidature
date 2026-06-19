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
