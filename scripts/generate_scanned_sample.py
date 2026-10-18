#!/usr/bin/env python3
"""
Generate a purely scanned/image-based Navodaya PDF fixture (no selectable text layer)
to test OCR handling and uncertainty flagging.
"""

import os
import pymupdf as fitz
from PIL import Image, ImageDraw, ImageFont

def generate_scanned_pdf():
    os.makedirs("test_fixtures", exist_ok=True)
    pdf_path = os.path.join("test_fixtures", "navodaya_scanned_paper.pdf")

    # Create a full page image (A4 size ratio)
    img = Image.new('RGB', (800, 1100), color=(250, 250, 245))
    draw = ImageDraw.Draw(img)

    # Try loading Nirmala or default font
    font_path = "C:/Windows/Fonts/Nirmala.ttc"
    font = None
    if os.path.exists(font_path):
        try:
            font = ImageFont.truetype(font_path, 22)
            title_font = ImageFont.truetype(font_path, 26)
        except Exception:
            font = ImageFont.load_default()
            title_font = font
    else:
        font = ImageFont.load_default()
        title_font = font

    # Draw header text onto the bitmap image (so no selectable text layer exists!)
    draw.text((80, 60), "जवाहर नवोदय विद्यालय - स्कॅन केलेली चाचणी", font=title_font, fill=(30, 30, 30))
    draw.text((80, 110), "विभाग I: मानसिक क्षमता चाचणी (Scanned Page)", font=font, fill=(70, 70, 70))
    draw.line([(80, 150), (720, 150)], fill=(180, 180, 180), width=2)

    # Question 1
    draw.text((80, 180), "प्रश्न 1. वेगळा पर्याय शोधा:", font=font, fill=(0, 0, 0))
    draw.text((100, 220), "(A) 12", font=font, fill=(20, 20, 20))
    draw.text((250, 220), "(B) 24", font=font, fill=(20, 20, 20))
    draw.text((400, 220), "(C) 37 (मूळ संख्या - Prime)", font=font, fill=(20, 20, 20))
    draw.text((100, 260), "(D) 48", font=font, fill=(20, 20, 20))

    # Draw small geometric diagram on the scanned sheet
    draw.rectangle([100, 320, 220, 440], outline=(0, 0, 0), width=3)
    draw.ellipse([120, 340, 200, 420], outline=(79, 70, 229), width=3)

    img_path = os.path.join("test_fixtures", "scanned_page.png")
    img.save(img_path)

    # Put the image into a PDF without selectable text
    doc = fitz.open()
    page = doc.new_page(width=800, height=1100)
    page.insert_image(fitz.Rect(0, 0, 800, 1100), filename=img_path)
    doc.save(pdf_path)
    doc.close()

    print(f"Generated sample scanned PDF: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    generate_scanned_pdf()
