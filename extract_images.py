import fitz

doc = fitz.open("Mind2Mascle (1).pdf")
for page_index in range(len(doc)):
    page = doc.load_page(page_index)
    image_list = page.get_images(full=True)
    for image_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        image_filename = f"image{page_index+1}_{image_index+1}.{image_ext}"
        with open(image_filename, "wb") as f:
            f.write(image_bytes)
