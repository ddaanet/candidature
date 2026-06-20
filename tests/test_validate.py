import contextlib
import datetime
import io
import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src" / "scripts"))
import validate


class TestParseFrontmatter:
    def test_parse_paires_simples(self):
        text = "---\nentreprise: Mirakl\nstatut: refus\n---\n\nCorps.\n"
        fm = validate.parse_frontmatter(text)
        assert fm["entreprise"] == "Mirakl"
        assert fm["statut"] == "refus"

    def test_pas_de_frontmatter_retourne_none(self):
        assert validate.parse_frontmatter("# Titre\n\nCorps sans frontmatter.\n") is None

    def test_valeur_avec_deux_points(self):
        text = "---\nposte: Ingénieur : backend\n---\n"
        fm = validate.parse_frontmatter(text)
        assert fm["poste"] == "Ingénieur : backend"

    def test_valeurs_vides_conservees(self):
        text = "---\ncanal:\n---\n"
        fm = validate.parse_frontmatter(text)
        assert fm["canal"] == ""


class TestValidateCandidature:
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
        assert anomalies == []

    def test_cle_requise_manquante(self):
        fm = self.valid_fm()
        del fm["poste"]
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        assert any("poste" in a for a in anomalies)

    def test_statut_hors_enum(self):
        fm = self.valid_fm()
        fm["statut"] = "rejeté"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        assert any("statut" in a for a in anomalies)

    def test_statut_a_trier_sans_canal_ni_date_conforme(self):
        fm = {"entreprise": "X", "poste": "Y", "statut": "à trier"}
        anomalies = validate.validate_candidature("2026-06-19-x", fm, self.TODAY)
        assert anomalies == []

    def test_statut_shortlist_sans_canal_ni_date_conforme(self):
        fm = {"entreprise": "X", "poste": "Y", "statut": "shortlist"}
        anomalies = validate.validate_candidature("2026-06-19-x", fm, self.TODAY)
        assert anomalies == []

    def test_date_non_parsable(self):
        fm = self.valid_fm()
        fm["date_soumission"] = "09/04/2026"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        assert any("date_soumission" in a and "format" in a for a in anomalies)

    def test_date_soumission_dans_le_futur(self):
        fm = self.valid_fm()
        fm["date_soumission"] = "2026-12-31"
        fm["date_reponse"] = "2027-01-05"
        anomalies = validate.validate_candidature("2026-12-31-mirakl", fm, self.TODAY)
        assert any("futur" in a for a in anomalies)

    def test_date_dossier_incoherente(self):
        fm = self.valid_fm()
        anomalies = validate.validate_candidature("2026-04-01-mirakl", fm, self.TODAY)
        assert any("dossier" in a for a in anomalies)

    def test_date_reponse_avant_soumission(self):
        fm = self.valid_fm()
        fm["date_reponse"] = "2026-04-01"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        assert any("date_reponse" in a and "antérieure" in a for a in anomalies)

    def test_date_shortlist_apres_soumission(self):
        fm = self.valid_fm()
        fm["date_shortlist"] = "2026-04-20"
        anomalies = validate.validate_candidature("2026-04-09-mirakl", fm, self.TODAY)
        assert any("date_shortlist" in a for a in anomalies)


class TestScan:
    TODAY = datetime.date(2026, 6, 19)

    def _ecrire(self, base, dossier, frontmatter):
        d = pathlib.Path(base) / "candidatures" / dossier
        d.mkdir(parents=True)
        (d / "README.md").write_text(f"---\n{frontmatter}---\n\nCorps.\n", encoding="utf-8")

    def test_scan_repere_anomalie(self):
        with tempfile.TemporaryDirectory() as base:
            self._ecrire(base, "2026-04-09-mirakl", "entreprise: Mirakl\nposte: X\nstatut: rejeté\n")
            result = validate.scan(base, self.TODAY)
            assert "2026-04-09-mirakl" in result

    def test_scan_silencieux_si_conforme(self):
        with tempfile.TemporaryDirectory() as base:
            self._ecrire(
                base,
                "2026-06-19-x",
                "entreprise: X\nposte: Y\nstatut: à trier\n",
            )
            result = validate.scan(base, self.TODAY)
            assert result == {}

    def test_scan_ignore_a_trier_fichier(self):
        with tempfile.TemporaryDirectory() as base:
            (pathlib.Path(base) / "candidatures").mkdir(parents=True)
            (pathlib.Path(base) / "candidatures" / "_a-trier.md").write_text("# À trier\n", encoding="utf-8")
            result = validate.scan(base, self.TODAY)
            assert result == {}

    def test_readme_sans_frontmatter_signale(self):
        with tempfile.TemporaryDirectory() as base:
            d = pathlib.Path(base) / "candidatures" / "2026-04-09-mirakl"
            d.mkdir(parents=True)
            (d / "README.md").write_text("# Pas de frontmatter\n", encoding="utf-8")
            result = validate.scan(base, self.TODAY)
            assert "2026-04-09-mirakl" in result
            assert any("frontmatter" in a for a in result["2026-04-09-mirakl"])


class TestMainCli:
    def _run(self, argv):
        out = io.StringIO()
        err = io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = validate.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_today_malforme_ne_plante_pas(self):
        with tempfile.TemporaryDirectory() as base:
            code, _, err = self._run(["validate.py", base, "--today", "2026-13-99"])
            assert code == 2
            assert "today" in err

    def test_today_sans_valeur(self):
        with tempfile.TemporaryDirectory() as base:
            code, _, err = self._run(["validate.py", base, "--today"])
            assert code == 2
            assert "today" in err

    def test_option_inconnue_signalee(self):
        with tempfile.TemporaryDirectory() as base:
            code, _, err = self._run(["validate.py", base, "--inconnu"])
            assert code == 2
            assert "--inconnu" in err

    def test_today_valide_repo_vide(self):
        with tempfile.TemporaryDirectory() as base:
            code, out, _ = self._run(["validate.py", base, "--today", "2026-06-19"])
            assert code == 0
            assert "conformes" in out
