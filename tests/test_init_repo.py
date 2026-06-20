import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src" / "scripts"))
import init_repo


class TestInitRepo:
    def test_cree_structure_complete(self):
        with tempfile.TemporaryDirectory() as d:
            created = init_repo.init_repo(d)
            root = pathlib.Path(d)
            assert (root / "candidatures").is_dir()
            assert (root / "sites").is_dir()
            assert (root / "recherches").is_dir()
            assert (root / "fiche-candidat.md").is_file()
            assert (root / "tendances.md").is_file()
            assert (root / "candidatures" / "_a-trier.md").is_file()
            assert (root / ".candidature").is_file()
            assert set(created) == {
                "candidatures",
                "sites",
                "recherches",
                "fiche-candidat.md",
                "tendances.md",
                "candidatures/_a-trier.md",
                ".candidature",
            }

    def test_sentinelle_porte_la_version(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            text = (pathlib.Path(d) / ".candidature").read_text(encoding="utf-8")
            assert text.strip() == "format: 1"

    def test_fiche_candidat_porte_le_marqueur_gabarit(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            text = (pathlib.Path(d) / "fiche-candidat.md").read_text(encoding="utf-8")
            assert init_repo.GABARIT_MARKER in text

    def test_idempotent_ne_recree_rien(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            second = init_repo.init_repo(d)
            assert second == []

    def test_idempotent_ne_modifie_pas_le_contenu(self):
        with tempfile.TemporaryDirectory() as d:
            init_repo.init_repo(d)
            fiche = pathlib.Path(d) / "fiche-candidat.md"
            fiche.write_text("profil rempli", encoding="utf-8")
            init_repo.init_repo(d)
            assert fiche.read_text(encoding="utf-8") == "profil rempli"
