"""Bounded text extraction for student practice documents."""

from __future__ import annotations

from io import BytesIO
from pathlib import PurePath
from xml.etree import ElementTree
from zipfile import BadZipFile, ZipFile

from pypdf import PdfReader
from pypdf.errors import PdfReadError


class PracticeImportError(ValueError):
    pass


MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_ESSAY_CHARS = 50000


def extract_practice_text(filename: str, data: bytes) -> str:
    extension = PurePath(filename).suffix.lower()
    if len(data) > MAX_FILE_BYTES:
        raise PracticeImportError("File exceeds the 10 MB limit")
    if extension in {".txt", ".md"}:
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise PracticeImportError("Text file must use UTF-8 encoding") from exc
    elif extension == ".pdf":
        try:
            reader = PdfReader(BytesIO(data))
            if reader.is_encrypted or len(reader.pages) > 100:
                raise PracticeImportError("Encrypted or very long PDFs cannot be imported")
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except (PdfReadError, ValueError, OSError) as exc:
            if isinstance(exc, PracticeImportError):
                raise
            raise PracticeImportError("PDF text could not be extracted") from exc
    elif extension == ".docx":
        try:
            with ZipFile(BytesIO(data)) as archive:
                info = archive.getinfo("word/document.xml")
                if info.file_size > 2 * 1024 * 1024:
                    raise PracticeImportError("DOCX document text is too large")
                root = ElementTree.fromstring(archive.read(info))
            namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
            text = "\n".join(
                "".join(node.text or "" for node in paragraph.iter(f"{namespace}t"))
                for paragraph in root.iter(f"{namespace}p")
            )
        except (BadZipFile, KeyError, ElementTree.ParseError, ValueError) as exc:
            if isinstance(exc, PracticeImportError):
                raise
            raise PracticeImportError("DOCX text could not be extracted") from exc
    else:
        raise PracticeImportError("Use a .txt, .md, .pdf, or .docx file")
    text = text.strip()
    if not text:
        raise PracticeImportError("This document contains no selectable text")
    if len(text) > MAX_ESSAY_CHARS:
        raise PracticeImportError("Extracted essay exceeds the 50,000 character limit")
    return text
