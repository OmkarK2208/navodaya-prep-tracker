#!/usr/bin/env python3
"""
Navodaya Prep Tracker - Automatic PDF Question Paper Extractor
Extracts text, questions, options (A, B, C, D), Marathi & English Unicode text,
and crops visual reasoning diagrams using PyMuPDF (fitz) and Pillow.
"""

import sys
import os
import json
import re

# Ensure standard output handles Marathi and Devanagari Unicode correctly on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import pymupdf as fitz
from PIL import Image
import io

# Devanagari digit converter
DEV_TO_ENG = str.maketrans('०१२३४५६७८९', '0123456789')

def normalize_digits(text: str) -> str:
    if not text:
        return ""
    return text.translate(DEV_TO_ENG)

def normalize_option_label(raw_label: str) -> str:
    lbl = raw_label.strip().upper()
    lbl = lbl.translate(DEV_TO_ENG)
    mapping = {
        '1': 'A', 'A': 'A', 'अ': 'A',
        '2': 'B', 'B': 'B', 'ब': 'B',
        '3': 'C', 'C': 'C', 'क': 'C',
        '4': 'D', 'D': 'D', 'ड': 'D',
    }
    return mapping.get(lbl, lbl)

def extract_pdf_data(pdf_path: str, uploads_dir: str):
    if not os.path.exists(pdf_path):
        return {"success": False, "error": f"File not found: {pdf_path}"}

    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    images_dir = os.path.join(uploads_dir, "extracted_images")
    os.makedirs(images_dir, exist_ok=True)

    extracted_questions = []
    scanned_pages_count = 0
    all_page_texts = []

    current_subject_code = "MAT"
    current_subject_name = "Mental Ability Test"
    current_instructions = None

    # Track extracted images per page to associate with questions
    page_images_map = {}

    for page_num in range(total_pages):
        page = doc[page_num]
        page_text = page.get_text("text")
        all_page_texts.append(page_text)

        # Extract embedded images on this page
        img_list = page.get_images(full=True)
        page_images = []
        for img_idx, img_info in enumerate(img_list):
            xref = img_info[0]
            try:
                base_img = doc.extract_image(xref)
                image_bytes = base_img["image"]
                image_ext = base_img["ext"]
                
                # Check dimensions: ignore tiny icons
                width = base_img.get("width", 0)
                height = base_img.get("height", 0)
                if width >= 50 and height >= 50:
                    filename = f"fig_p{page_num + 1}_{img_idx + 1}_{xref}.{image_ext}"
                    filepath = os.path.join(images_dir, filename)
                    with open(filepath, "wb") as f:
                        f.write(image_bytes)
                    page_images.append(f"/uploads/extracted_images/{filename}")
            except Exception as e:
                pass
        
        page_images_map[page_num + 1] = page_images

        # Check if page is predominantly scanned/image-based
        if len(page_text.strip()) < 40 and len(img_list) > 0:
            scanned_pages_count += 1

    is_predominantly_scanned = (scanned_pages_count / max(1, total_pages)) > 0.6

    # Parse questions from text
    full_document_text = "\n".join(all_page_texts)

    # Detect Section / Subject headers in Marathi & English
    # Section 1: मानसिक क्षमता चाचणी (Q1-40)
    # Section 2: अंकगणित चाचणी (Q41-60)
    # Section 3: भाषा चाचणी (Q61-80)
    
    # Split by common question markers
    # Matches: प्रश्न 1., Q. 1, 1., १., प्रश्न क्र. 1 etc.
    q_pattern = re.compile(
        r'(?:(?:\n|^)\s*(?:प्रश्न\s*(?:क्र\.)?|Q\.?|Question\s*)?\s*([0-9०-९]+)[\.\:\-\)]\s+)',
        re.MULTILINE
    )

    matches = list(q_pattern.finditer(full_document_text))

    if matches:
        for idx, match in enumerate(matches):
            q_num_raw = match.group(1)
            q_num = int(normalize_digits(q_num_raw))

            # Determine text slice for this question
            start_pos = match.end()
            end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(full_document_text)
            q_block = full_document_text[start_pos:end_pos].strip()

            # Determine subject based on official Navodaya pattern if not explicitly titled
            if q_num <= 40:
                subj_code = "MAT"
                subj_name = "Mental Ability Test"
            elif q_num <= 60:
                subj_code = "MATH"
                subj_name = "Arithmetic Test"
            else:
                subj_code = "LANG"
                subj_name = "Language Test"

            # Parse options (A, B, C, D) or (1, 2, 3, 4) or (अ, ब, क, ड)
            opt_pattern = re.compile(
                r'[\(\[]?\s*([A-Da-d1-4१-४अ-ड])\s*[\)\]\.\:]\s*(.*?)(?=(?:[\(\[]?\s*[A-Da-d1-4१-४अ-ड]\s*[\)\]\.\:]|$))',
                re.DOTALL
            )
            opt_matches = list(opt_pattern.finditer(q_block))

            options = []
            question_text = q_block
            is_uncertain = False
            uncertainty_reason = None

            if len(opt_matches) >= 2:
                # Question text is before the first option
                first_opt_start = opt_matches[0].start()
                question_text = q_block[:first_opt_start].strip()

                seen_labels = set()
                for om in opt_matches:
                    raw_lbl = om.group(1)
                    norm_lbl = normalize_option_label(raw_lbl)
                    opt_txt = om.group(2).strip()
                    # Strip trailing section headers from option text
                    opt_txt = re.split(r'(?:विभाग\s*[I|V|X|0-9]+|Section\s*[I|V|X|0-9]+|उतारा\s*:|Passage\s*:)', opt_txt)[0].strip()
                    # Clean up trailing newlines and spaces
                    opt_txt = re.sub(r'\s+', ' ', opt_txt).strip()

                    if norm_lbl in ['A', 'B', 'C', 'D'] and norm_lbl not in seen_labels:
                        options.append({
                            "option_label": norm_lbl,
                            "option_text": opt_txt if opt_txt else f"Figure / Option {norm_lbl}"
                        })
                        seen_labels.add(norm_lbl)

            # Ensure 4 options A, B, C, D exist
            if len(options) != 4:
                is_uncertain = True
                uncertainty_reason = f"Extracted {len(options)} options instead of 4"
                
                # Fill missing options so exam engine remains consistent
                existing_labels = {o["option_label"] for o in options}
                for lbl in ['A', 'B', 'C', 'D']:
                    if lbl not in existing_labels:
                        options.append({
                            "option_label": lbl,
                            "option_text": f"(Option {lbl} to be confirmed)"
                        })
            
            # Sort options A, B, C, D
            options.sort(key=lambda o: o["option_label"])

            # Clean up question text
            question_text = re.sub(r'\s+', ' ', question_text).strip()
            if not question_text:
                question_text = f"प्रश्न क्र. {q_num} (Refer to the figure below)"
                is_uncertain = True
                uncertainty_reason = "Question text is short or graphic"

            # Check if this question is associated with an extracted image
            # In MAT (Q1-40), associate diagrams from appropriate pages
            assigned_img = None
            approx_page = min(total_pages, max(1, (q_num // 5) + 1))
            page_imgs = page_images_map.get(approx_page, [])
            if subj_code == "MAT" and len(page_imgs) > 0:
                # Pick corresponding image if available
                img_idx_pick = (q_num - 1) % len(page_imgs)
                assigned_img = page_imgs[img_idx_pick]

            extracted_questions.append({
                "question_number": q_num,
                "subject_code": subj_code,
                "subject_name": subj_name,
                "question_text": question_text,
                "options": options,
                "question_image_url": assigned_img,
                "marks": 1.25,
                "is_uncertain": is_uncertain,
                "uncertainty_reason": uncertainty_reason,
                "instructions": current_instructions
            })

    # If regex parsing didn't find standard question markers (e.g. in scanned or atypical formatting)
    # create structured draft items based on available text/page blocks
    if len(extracted_questions) == 0:
        # Fallback to generating review-ready items from blocks
        for p_idx in range(min(total_pages, 80)):
            q_num = p_idx + 1
            p_text = all_page_texts[p_idx].strip()
            subj_code = "MAT" if q_num <= 40 else ("MATH" if q_num <= 60 else "LANG")
            subj_name = "Mental Ability Test" if q_num <= 40 else ("Arithmetic Test" if q_num <= 60 else "Language Test")

            p_imgs = page_images_map.get(p_idx + 1, [])
            assigned_img = p_imgs[0] if len(p_imgs) > 0 else None

            extracted_questions.append({
                "question_number": q_num,
                "subject_code": subj_code,
                "subject_name": subj_name,
                "question_text": p_text if p_text else f"प्रश्न {q_num}: (कृपया आकृती किंवा मजकूर तपासा)",
                "options": [
                    {"option_label": "A", "option_text": "पर्याय A"},
                    {"option_label": "B", "option_text": "पर्याय B"},
                    {"option_label": "C", "option_text": "पर्याय C"},
                    {"option_label": "D", "option_text": "पर्याय D"}
                ],
                "question_image_url": assigned_img,
                "marks": 1.25,
                "is_uncertain": True,
                "uncertainty_reason": "Scanned page or non-standard format: Please verify text and options",
                "instructions": None
            })

    # Sort questions by question number
    extracted_questions.sort(key=lambda q: q["question_number"])

    return {
        "success": True,
        "total_pages": total_pages,
        "is_scanned": is_predominantly_scanned,
        "extracted_questions_count": len(extracted_questions),
        "questions": extracted_questions
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: extract_pdf.py <pdf_path> [uploads_dir] [output_json_path]"}, ensure_ascii=False))
        sys.exit(1)

    pdf_path = sys.argv[1]
    uploads_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(pdf_path)
    output_json_path = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        result = extract_pdf_data(pdf_path, uploads_dir)
        json_str = json.dumps(result, ensure_ascii=False, indent=2)
        if output_json_path:
            with open(output_json_path, "w", encoding="utf-8") as f:
                f.write(json_str)
        print(json_str)
    except Exception as e:
        err_res = {"success": False, "error": str(e)}
        print(json.dumps(err_res, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
