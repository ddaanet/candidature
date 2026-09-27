"""Expansion XML versionnée d'un CV DOCX, reconstruction et rendu PDF.

Usage :
    python3 cv_docx.py unpack <cv.docx> <dossier>
    python3 cv_docx.py pack <dossier> <cv.docx>
    python3 cv_docx.py render <cv.docx>

unpack décompresse le DOCX et indente le XML pour que git en donne des diffs
lisibles. pack retire cette indentation et rezippe. render convertit le DOCX
en PDF à côté de lui par LibreOffice, vérifie que le PDF vient d'être écrit et
affiche son nombre de pages. Sort en code 1 sur toute erreur.
"""
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from xml.dom import minidom

_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
_CONTENT_TYPES = "[Content_Types].xml"
_MAC_SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def _est_xml(name):
    return name.endswith((".xml", ".rels"))


def _a_des_elements(node):
    return any(c.nodeType == c.ELEMENT_NODE for c in node.childNodes)


def _retirer_blancs(node):
    """Retire les nœuds texte blancs d'un élément qui contient des éléments.

    Le texte d'un DOCX vit dans des feuilles (w:t) sans élément enfant, leurs
    espaces sont donc conservés.
    """
    for child in list(node.childNodes):
        if child.nodeType == child.TEXT_NODE:
            if not child.data.strip() and _a_des_elements(node):
                node.removeChild(child)
        elif child.nodeType == child.ELEMENT_NODE:
            _retirer_blancs(child)


def _indenter(node, depth):
    """Indente un élément dont les enfants sont tous des éléments."""
    children = list(node.childNodes)
    for child in children:
        if child.nodeType == child.ELEMENT_NODE:
            _indenter(child, depth + 1)
    if not children or any(c.nodeType != c.ELEMENT_NODE for c in children):
        return
    doc = node.ownerDocument
    for child in children:
        node.insertBefore(doc.createTextNode("\n" + "  " * (depth + 1)), child)
    node.appendChild(doc.createTextNode("\n" + "  " * depth))


def _serialiser(doc):
    return _DECLARATION + doc.documentElement.toxml()


def unpack(docx, dest):
    dest = pathlib.Path(dest)
    with zipfile.ZipFile(docx) as z:
        z.extractall(dest)
    for path in dest.rglob("*"):
        if path.is_file() and _est_xml(path.name):
            doc = minidom.parse(str(path))
            _retirer_blancs(doc.documentElement)
            _indenter(doc.documentElement, 0)
            path.write_text(_serialiser(doc) + "\n", encoding="utf-8")


def pack(src, docx):
    src = pathlib.Path(src)
    if not (src / _CONTENT_TYPES).is_file():
        raise ValueError(f"{src} n'est pas une expansion DOCX, {_CONTENT_TYPES} manque")
    files = sorted(p for p in src.rglob("*") if p.is_file())
    files.sort(key=lambda p: p.relative_to(src).as_posix() != _CONTENT_TYPES)
    docx = pathlib.Path(docx)
    tmp = docx.with_name(docx.name + ".tmp")
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for path in files:
            rel = path.relative_to(src).as_posix()
            if _est_xml(path.name):
                doc = minidom.parse(str(path))
                _retirer_blancs(doc.documentElement)
                z.writestr(rel, _serialiser(doc).encode("utf-8"))
            else:
                z.write(path, rel)
    tmp.replace(docx)


def _soffice():
    for name in ("soffice", "libreoffice"):
        found = shutil.which(name)
        if found:
            return found
    if os.path.exists(_MAC_SOFFICE):
        return _MAC_SOFFICE
    raise RuntimeError("LibreOffice introuvable (soffice), il faut l'installer pour rendre le PDF")


def _pages(pdf):
    if shutil.which("pdfinfo"):
        out = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
        match = re.search(r"^Pages:\s+(\d+)", out, re.MULTILINE)
        if match:
            return int(match.group(1))
    # Repli : LibreOffice écrit les dictionnaires de page en clair.
    return len(re.findall(rb"/Type\s*/Page\b(?!s)", pdf.read_bytes()))


def render(docx):
    docx = pathlib.Path(docx).resolve()
    if not docx.is_file():
        raise FileNotFoundError(f"{docx} introuvable")
    pdf = docx.with_suffix(".pdf")
    profile = pathlib.Path(tempfile.gettempdir()) / "candidature-lo-profile"
    start = time.time()
    result = subprocess.run(
        [
            _soffice(),
            "--headless",
            f"-env:UserInstallation={profile.as_uri()}",
            "--convert-to",
            "pdf",
            "--outdir",
            str(docx.parent),
            str(docx),
        ],
        capture_output=True,
        text=True,
    )
    if not pdf.exists() or pdf.stat().st_mtime < start - 1:
        raise RuntimeError(
            f"{pdf.name} n'a pas été écrit, un PDF de ce nom serait périmé. "
            "En bac à sable, soffice échoue sur « no valid pipe path found », "
            "relancer hors bac à sable.\n" + result.stdout + result.stderr
        )
    return pdf, _pages(pdf)


def main(argv):
    if len(argv) < 2 or argv[0] not in ("unpack", "pack", "render"):
        print(__doc__, file=sys.stderr)
        return 1
    try:
        if argv[0] == "unpack" and len(argv) == 3:
            unpack(argv[1], argv[2])
            print(f"expansion écrite dans {argv[2]}")
        elif argv[0] == "pack" and len(argv) == 3:
            pack(argv[1], argv[2])
            print(f"DOCX écrit : {argv[2]}")
        elif argv[0] == "render" and len(argv) == 2:
            pdf, pages = render(argv[1])
            print(f"PDF écrit : {pdf}\npages : {pages}")
        else:
            print(__doc__, file=sys.stderr)
            return 1
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile) as exc:
        print(f"erreur : {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
