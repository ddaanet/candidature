import os
import pathlib
import stat
import sys
import zipfile

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src" / "scripts"))
import cv_docx

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W14 = "http://schemas.microsoft.com/office/word/2010/wordml"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"

DOCUMENT = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    f'<w:document xmlns:w="{W}" xmlns:w14="{W14}" xmlns:mc="{MC}" mc:Ignorable="w14">'
    "<w:body><w:p><w:r><w:t xml:space=\"preserve\">Senior backend </w:t></w:r>"
    "<w:r><w:t xml:space=\"preserve\"> </w:t></w:r>"
    "<w:r><w:rPr><w:b/></w:rPr><w:t>engineer</w:t></w:r></w:p></w:body></w:document>"
)
CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="xml" ContentType="application/xml"/></Types>'
)


@pytest.fixture
def docx(tmp_path):
    path = tmp_path / "cv.docx"
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("word/document.xml", DOCUMENT)
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("word/media/image1.png", b"\x89PNG binaire")
    return path


class TestUnpack:
    def test_indente_le_xml(self, docx, tmp_path):
        cv_docx.unpack(docx, tmp_path / "cv")
        text = (tmp_path / "cv" / "word" / "document.xml").read_text(encoding="utf-8")
        assert "\n  <w:body>\n    <w:p>\n" in text

    def test_ne_touche_pas_le_texte_des_feuilles(self, docx, tmp_path):
        cv_docx.unpack(docx, tmp_path / "cv")
        text = (tmp_path / "cv" / "word" / "document.xml").read_text(encoding="utf-8")
        assert '<w:t xml:space="preserve">Senior backend </w:t>' in text
        assert '<w:t xml:space="preserve"> </w:t>' in text


class TestPack:
    def test_aller_retour_restitue_le_xml(self, docx, tmp_path):
        cv_docx.unpack(docx, tmp_path / "cv")
        cv_docx.pack(tmp_path / "cv", tmp_path / "out.docx")
        with zipfile.ZipFile(tmp_path / "out.docx") as z:
            assert z.read("word/document.xml").decode("utf-8") == DOCUMENT
            assert z.read("word/media/image1.png") == b"\x89PNG binaire"

    def test_content_types_en_tete_d_archive(self, docx, tmp_path):
        cv_docx.unpack(docx, tmp_path / "cv")
        cv_docx.pack(tmp_path / "cv", tmp_path / "out.docx")
        with zipfile.ZipFile(tmp_path / "out.docx") as z:
            assert z.namelist()[0] == "[Content_Types].xml"

    def test_edition_de_l_expansion_passe_dans_le_docx(self, docx, tmp_path):
        cv_docx.unpack(docx, tmp_path / "cv")
        doc = tmp_path / "cv" / "word" / "document.xml"
        doc.write_text(doc.read_text(encoding="utf-8").replace("engineer", "developer"), encoding="utf-8")
        cv_docx.pack(tmp_path / "cv", tmp_path / "out.docx")
        with zipfile.ZipFile(tmp_path / "out.docx") as z:
            assert "<w:t>developer</w:t>" in z.read("word/document.xml").decode("utf-8")

    def test_refuse_un_dossier_qui_n_est_pas_une_expansion(self, tmp_path):
        (tmp_path / "vide").mkdir()
        with pytest.raises(ValueError, match="Content_Types"):
            cv_docx.pack(tmp_path / "vide", tmp_path / "out.docx")


def _faux_soffice(bindir, script):
    bindir.mkdir()
    path = bindir / "soffice"
    path.write_text("#!/bin/sh\n" + script, encoding="utf-8")
    path.chmod(path.stat().st_mode | stat.S_IEXEC)


class TestRender:
    def test_refuse_un_pdf_perime(self, docx, tmp_path, monkeypatch):
        pdf = docx.with_suffix(".pdf")
        pdf.write_bytes(b"%PDF ancien")
        os.utime(pdf, (0, 0))
        _faux_soffice(tmp_path / "bin", 'echo "ERROR: no valid pipe path found."\n')
        monkeypatch.setenv("PATH", str(tmp_path / "bin"))
        with pytest.raises(RuntimeError, match="périmé"):
            cv_docx.render(docx)

    def test_compte_les_pages_du_pdf_ecrit(self, docx, tmp_path, monkeypatch):
        pdf = "<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type /Page >>"
        _faux_soffice(tmp_path / "bin", f'for a; do d="$a"; done\nprintf "{pdf}" > "${{d%.docx}}.pdf"\n')
        monkeypatch.setenv("PATH", str(tmp_path / "bin"))
        written, pages = cv_docx.render(docx)
        assert written == docx.resolve().with_suffix(".pdf")
        assert pages == 2
