import fitz

doc = fitz.open("Mind2Mascle (1).pdf")
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    pix.save(f"page-{i}.png")
