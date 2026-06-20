# tests/test_dispatch.py
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src" / "scripts"))
import dispatch


class TestDeriveRepoStatus:
    def test_sentinel_format_1_is_ready(self):
        assert dispatch.derive_repo_status("format: 1\n", True) == ("ready", 1)

    def test_sentinel_format_2_is_too_new(self):
        assert dispatch.derive_repo_status("format: 2\n", True) == ("too-new", 2)

    def test_absent_sentinel_with_candidatures_is_adopt(self):
        assert dispatch.derive_repo_status(None, True) == ("adopt", None)

    def test_absent_sentinel_empty_dir_is_uninitialized(self):
        assert dispatch.derive_repo_status(None, False) == ("uninitialized", None)


class TestRoute:
    def base(self, **kw):
        state = {"repo_status": "ready", "fiche": "rempli", "slug_known": True, "form_captured": False}
        state.update(kw)
        return state

    def test_repo_too_new_routes_to_update(self):
        assert dispatch.route("resume", self.base(repo_status="too-new"))["action"] == "update_skill"

    def test_repo_uninitialized_routes_to_init_create(self):
        assert dispatch.route("offer", self.base(repo_status="uninitialized")) == {"action": "init", "proposal": "create"}

    def test_repo_adopt_routes_to_init_adopt(self):
        assert dispatch.route("offer", self.base(repo_status="adopt")) == {"action": "init", "proposal": "adopt"}

    def test_feedback_routes_to_suivi(self):
        assert dispatch.route("feedback", self.base()) == {"action": "load_phase", "phase": "suivi", "file": "references/suivi.md"}

    def test_gabarit_fiche_routes_to_profil_before_offer(self):
        assert dispatch.route("offer", self.base(fiche="gabarit")) == {"action": "load_phase", "phase": "profil", "file": "references/profil.md"}

    def test_offer_routes_to_preparation(self):
        assert dispatch.route("offer", self.base()) == {"action": "load_phase", "phase": "preparation", "file": "references/preparation.md"}

    def test_submit_without_slug_known_is_refused(self):
        assert dispatch.route("submit", self.base(slug_known=False)) == {"refused": True, "reason": "slug inconnu"}

    def test_submit_without_form_routes_to_capture(self):
        assert dispatch.route("submit", self.base(form_captured=False)) == {"action": "capture_form", "phase": "soumission", "file": "references/soumission.md", "step": "explore_form"}

    def test_submit_with_form_routes_to_generate(self):
        assert dispatch.route("submit", self.base(form_captured=True)) == {"action": "load_phase", "phase": "soumission", "file": "references/soumission.md", "step": "generate"}

    def test_resume_default_routes_to_preparation(self):
        assert dispatch.route("resume", self.base()) == {"action": "load_phase", "phase": "preparation", "file": "references/preparation.md"}


class TestTransition:
    def test_unknown_statut_refused(self):
        ok, reason = dispatch.validate_transition("zzz", {})
        assert ok is False
        assert "ensemble" in reason

    def test_en_attente_needs_canal_and_date(self):
        ok, reason = dispatch.validate_transition("en attente", {"canal": "Lever"})
        assert ok is False
        assert "date_soumission" in reason

    def test_en_attente_complete_is_ok(self):
        ok, reason = dispatch.validate_transition("en attente", {"canal": "Lever", "date_soumission": "2026-06-20"})
        assert ok is True
        assert reason is None

    def test_refus_needs_reponse_date(self):
        ok, reason = dispatch.validate_transition("refus", {"canal": "Lever", "date_soumission": "2026-06-20"})
        assert ok is False
        assert "date_reponse" in reason

    def test_shortlist_is_ok_without_canal(self):
        ok, reason = dispatch.validate_transition("shortlist", {})
        assert ok is True


class TestFrontmatterIO:
    FM = "---\nentreprise: Goodays\nstatut: shortlist\n---\n\nCorps.\n"

    def test_set_existing_key_replaces_value(self):
        out = dispatch.set_frontmatter_key(self.FM, "statut", "en attente")
        fm = dispatch.validate.parse_frontmatter(out)
        assert fm["statut"] == "en attente"
        assert fm["entreprise"] == "Goodays"

    def test_set_new_key_inserts_before_close(self):
        out = dispatch.set_frontmatter_key(self.FM, "canal", "Greenhouse")
        fm = dispatch.validate.parse_frontmatter(out)
        assert fm["canal"] == "Greenhouse"
        assert out.rstrip().endswith("Corps.")

    def test_form_record_roundtrips_as_json_value(self):
        fields = [{"libelle": "Lettre", "type": "texte_libre", "taille": "10 lignes"}]
        out = dispatch.set_frontmatter_key(self.FM, "formulaire", json.dumps(fields, ensure_ascii=False))
        fm = dispatch.validate.parse_frontmatter(out)
        assert dispatch.form_captured(fm) is True
        assert dispatch.load_form(fm) == fields

    def test_no_form_means_not_captured(self):
        fm = dispatch.validate.parse_frontmatter(self.FM)
        assert dispatch.form_captured(fm) is False
        assert dispatch.load_form(fm) == []
