import { describe, it, expect, beforeEach } from 'vitest';
import { LocalPersistentRepository } from '../db/local-db';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('PDF-to-Question-Paper Generator Pipeline', () => {
  const marathiPdfPath = path.resolve(process.cwd(), 'test_fixtures', 'navodaya_marathi_paper.pdf');
  const scannedPdfPath = path.resolve(process.cwd(), 'test_fixtures', 'navodaya_scanned_paper.pdf');
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'extract_pdf.py');
  const testUploadsDir = path.resolve(process.cwd(), 'public', 'uploads');

  beforeEach(() => {
    if (!fs.existsSync(testUploadsDir)) {
      fs.mkdirSync(testUploadsDir, { recursive: true });
    }
  });

  it('verifies that the test fixtures exist', () => {
    expect(fs.existsSync(marathiPdfPath)).toBe(true);
    expect(fs.existsSync(scannedPdfPath)).toBe(true);
  });

  it('extracts Marathi text-based PDF preserving Unicode and cropping diagrams', () => {
    const tempJson = path.join(testUploadsDir, `test_out_${Date.now()}.json`);
    const result = spawnSync('python', ['-X', 'utf8', scriptPath, marathiPdfPath, testUploadsDir, tempJson], {
      encoding: 'utf8',
      windowsHide: true,
    });

    expect(result.status).toBe(0);
    expect(fs.existsSync(tempJson)).toBe(true);

    const jsonContent = fs.readFileSync(tempJson, 'utf8');
    fs.unlinkSync(tempJson); // clean up

    const parsed = JSON.parse(jsonContent);
    expect(parsed.success).toBe(true);
    expect(parsed.questions.length).toBeGreaterThanOrEqual(5);

    // Verify Marathi text is preserved exactly (Devanagari characters)
    const marathiSample = parsed.questions.some((q: any) =>
      /[\u0900-\u097F]/.test(q.question_text)
    );
    expect(marathiSample).toBe(true);

    // Verify MAT reasoning diagram was extracted & cropped
    const matQ = parsed.questions.find((q: any) => q.subject_code === 'MAT');
    expect(matQ).toBeDefined();
    expect(matQ?.question_image_url).toBeDefined();
    expect(matQ?.question_image_url).toContain('/uploads/extracted_images/');

    // Verify option labels (A, B, C, D)
    const firstQ = parsed.questions[0];
    expect(firstQ.options.length).toBe(4);
    expect(firstQ.options.map((o: any) => o.option_label)).toEqual(['A', 'B', 'C', 'D']);

    // Verify correct answers are NOT guessed (all is_correct should be false by default until admin verifies)
    const anyAutoGuessed = firstQ.options.some((o: any) => o.is_correct === true);
    expect(anyAutoGuessed).toBe(false);
  });

  it('detects scanned PDF and flags uncertainty for review', () => {
    const tempJson = path.join(testUploadsDir, `test_scanned_${Date.now()}.json`);
    const result = spawnSync('python', ['-X', 'utf8', scriptPath, scannedPdfPath, testUploadsDir, tempJson], {
      encoding: 'utf8',
      windowsHide: true,
    });

    expect(result.status).toBe(0);
    expect(fs.existsSync(tempJson)).toBe(true);

    const jsonContent = fs.readFileSync(tempJson, 'utf8');
    fs.unlinkSync(tempJson);

    const parsed = JSON.parse(jsonContent);
    expect(parsed.success).toBe(true);
    expect(parsed.is_scanned).toBe(true);

    // Should flag uncertainty for scanned pages without high-res digital text
    const hasUncertain = parsed.questions.some((q: any) => q.is_uncertain === true);
    expect(hasUncertain).toBe(true);
  });

  it('persists extracted paper and questions into repository without losing Marathi formatting', async () => {
    const repo = new LocalPersistentRepository();
    const subjects = await repo.getSubjects();
    const matSub = subjects.find((s) => s.code === 'MAT');

    const paper = await repo.createPaper({
      title: 'मराठी नवोदय सराव परीक्षा २०२६ (PDF Auto-Generated)',
      description: 'Extracted with automated diagram cropping & Devanagari text preservation',
      duration_minutes: 120,
      total_marks: 50,
      negative_marking_per_question: 0,
      is_published: true,
      pdf_path: '/uploads/sample.pdf',
    });

    expect(paper.id).toBeDefined();

    // Add Marathi question with cropped diagram
    const q = await repo.addQuestion({
      paper_id: paper.id,
      subject_id: matSub?.id,
      question_number: 1,
      question_text: 'खालील प्रश्नात डाव्या बाजूला प्रश्न आकृती दिलेली आहे. उत्तर आकृत्यांमधून तंतोतंत जुळणारी आकृती निवडा.',
      question_image_url: '/uploads/extracted_images/sample_diagram.png',
      marks: 1.25,
      explanation: 'पर्याय (B) मधील आकृती प्रश्न आकृतीशी तंतोतंत जुळते.',
      options: [
        { option_label: 'A', option_text: 'आकृती A', is_correct: false },
        { option_label: 'B', option_text: 'आकृती B (तंतोतंत जुळणारी)', is_correct: true },
        { option_label: 'C', option_text: 'आकृती C', is_correct: false },
        { option_label: 'D', option_text: 'आकृती D', is_correct: false },
      ],
    });

    expect(q.id).toBeDefined();
    expect(q.question_text).toContain('तंतोतंत जुळणारी');

    // Retrieve paper with questions
    const fetched = await repo.getPaperById(paper.id);
    expect(fetched).toBeDefined();
    expect(fetched?.questions?.length).toBe(1);

    const retrievedQ = fetched?.questions?.[0];
    expect(retrievedQ?.question_image_url).toBe('/uploads/extracted_images/sample_diagram.png');
    expect(retrievedQ?.options.length).toBe(4);

    const correctOpt = retrievedQ?.options.find((o) => o.is_correct);
    expect(correctOpt?.option_label).toBe('B');
    expect(correctOpt?.option_text).toContain('तंतोतंत');
  });
});
