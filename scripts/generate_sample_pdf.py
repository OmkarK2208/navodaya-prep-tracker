#!/usr/bin/env python3
"""
Generate realistic sample Navodaya Class 6 PDFs (text and image-based)
including authentic Marathi questions and visual reasoning diagrams for testing.
"""

import os
import pymupdf as fitz
from PIL import Image, ImageDraw

def create_sample_diagram():
    os.makedirs("test_fixtures", exist_ok=True)
    img_path = os.path.join("test_fixtures", "temp_diag.png")
    
    # Create visual reasoning odd-man-out diagram
    img = Image.new('RGB', (300, 150), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Box 1
    draw.rectangle([10, 10, 70, 70], outline=(0, 0, 0), width=2)
    draw.polygon([(40, 15), (15, 65), (65, 65)], outline=(79, 70, 229), width=2) # Triangle
    # Box 2
    draw.rectangle([80, 10, 140, 70], outline=(0, 0, 0), width=2)
    draw.rectangle([95, 25, 125, 55], outline=(79, 70, 229), width=2) # Square
    # Box 3
    draw.rectangle([150, 10, 210, 70], outline=(0, 0, 0), width=2)
    draw.ellipse([165, 25, 195, 55], outline=(239, 68, 68), width=2) # Circle (Odd)
    # Box 4
    draw.rectangle([220, 10, 280, 70], outline=(0, 0, 0), width=2)
    draw.polygon([(250, 15), (275, 35), (265, 65), (235, 65), (225, 35)], outline=(79, 70, 229), width=2) # Pentagon

    img.save(img_path)
    return img_path

def generate_marathi_pdf():
    os.makedirs("test_fixtures", exist_ok=True)
    pdf_path = os.path.join("test_fixtures", "navodaya_marathi_paper.pdf")
    diag_path = create_sample_diagram()

    doc = fitz.open()
    font_path = "C:/Windows/Fonts/Nirmala.ttc"

    # Page 1: Section 1 - Mental Ability Test (मानसिक क्षमता चाचणी)
    page1 = doc.new_page()
    if os.path.exists(font_path):
        page1.insert_font(fontname="f0", fontfile=font_path)

    p1_text = """जवाहर नवोदय विद्यालय निवड चाचणी - सराव प्रश्नपत्रिका
विभाग I: मानसिक क्षमता चाचणी (Mental Ability Test)
एकूण प्रश्न: 40 | गुण: 50

सूचना: खालील प्रत्येक प्रश्नात चार आकृत्या (A), (B), (C), (D) दिलेल्या आहेत. या चार आकृत्यांपैकी तीन आकृत्या कुठल्या तरी दृष्टीने सारख्या आहेत आणि एक आकृती वेगळी आहे. त्या वेगळ्या आकृतीची निवड करा.

प्रश्न 1. खालील आकृत्यांपैकी वेगळी आकृती ओळखा (Odd Man Out):
(A) त्रिकोण (Triangle - 3 बाजू)
(B) चौकोन (Square - 4 बाजू)
(C) वर्तुळ (Circle - वक्र कडा)
(D) पंचकोन (Pentagon - 5 बाजू)

प्रश्न 2. संबंध जोडा (Analogy):
जर वर्तुळ : गोल (Sphere) तर चौरस : ?
(A) घन (Cube)
(B) आयत (Rectangle)
(C) शंकू (Cone)
(D) वृत्तचिती (Cylinder)
"""
    page1.insert_text((50, 50), p1_text, fontname="f0", fontsize=11)
    
    # Insert diagram on page 1 for question 1
    rect = fitz.Rect(50, 290, 350, 440)
    page1.insert_image(rect, filename=diag_path)

    # Page 2: Section 2 - Arithmetic Test (अंकगणित चाचणी)
    page2 = doc.new_page()
    if os.path.exists(font_path):
        page2.insert_font(fontname="f0", fontfile=font_path)

    p2_text = """विभाग II: अंकगणित चाचणी (Arithmetic Test)
एकूण प्रश्न: 20 | गुण: 25

प्रश्न 41. 27,845 या संख्येतील 7 ची स्थानिक किंमत आणि दर्शनी किंमत यामधील फरक किती?
(A) 7,000
(B) 6,993
(C) 6,990
(D) 0

प्रश्न 42. दोन संख्यांचा म.सा.वि. 16 असून त्यांचा गुणाकार 3072 आहे, तर त्यांचा ल.सा.वि. किती?
(A) 182
(B) 192
(C) 202
(D) 212

प्रश्न 43. सरळरूप द्या: 3/4 + 1/2 - 1/8 = ?
(A) 7/8
(B) 9/8
(C) 5/8
(D) 11/8
"""
    page2.insert_text((50, 50), p2_text, fontname="f0", fontsize=11)

    # Page 3: Section 3 - Language Test (भाषा चाचणी)
    page3 = doc.new_page()
    if os.path.exists(font_path):
        page3.insert_font(fontname="f0", fontfile=font_path)

    p3_text = """विभाग III: भाषा चाचणी (Language Test - मराठी)
एकूण प्रश्न: 20 | गुण: 25

उतारा:
एका जंगलात एक सुंदर आणि दयाळू हरीण राहात होते. ते सर्व प्राण्यांशी प्रेमाने वागत असे. एकदा एका छोट्या सशाचा पाय फांदीमध्ये अडकला होता. हरणाने आपल्या शिंगांनी ती फांदी बाजूला करून सशाचा जीव वाचवला.

प्रश्न 61. जंगलात कोण राहात होते?
(A) दयाळू हरीण
(B) क्रूर वाघ
(C) धूर्त कोल्हा
(D) खोडकर माकड

प्रश्न 62. हरणाने कोणाचा जीव वाचवला?
(A) सशाचा जीव
(B) कोल्ह्याचा जीव
(C) पक्षाचा जीव
(D) सिंहाचा जीव

प्रश्न 63. 'दयाळू' या शब्दाचा विरुद्धार्थी शब्द कोणता?
(A) प्रेमळ
(B) क्रूर किंवा दुष्ट
(C) शांत
(D) हुशार
"""
    page3.insert_text((50, 50), p3_text, fontname="f0", fontsize=11)

    doc.save(pdf_path)
    doc.close()

    print(f"Generated sample Marathi PDF: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    generate_marathi_pdf()
