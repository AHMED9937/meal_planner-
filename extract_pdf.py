import subprocess
import sys

# Install pymupdf
subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"], stdout=subprocess.DEVNULL)

import fitz # PyMuPDF

doc = fitz.open("Mind2Mascle (1).pdf")
for i, page in enumerate(doc):
    print(f"--- Page {i+1} ---")
    print(page.get_text())
