import fitz # PyMuPDF
import sys

doc = fitz.open("Mind2Mascle (1).pdf")
with open("pdf_content.txt", "w", encoding="utf-8") as f:
    for i, page in enumerate(doc):
        f.write(f"--- Page {i+1} ---\n")
        f.write(page.get_text())
