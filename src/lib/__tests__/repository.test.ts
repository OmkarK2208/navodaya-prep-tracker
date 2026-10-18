import { describe, it, expect, beforeEach } from 'vitest';
import { LocalPersistentRepository } from '../db/local-db';

describe('LocalPersistentRepository Database Operations', () => {
  let repo: LocalPersistentRepository;

  beforeEach(() => {
    repo = new LocalPersistentRepository();
  });

  it('loads default subjects and syllabus topics', async () => {
    const subjects = await repo.getSubjects();
    expect(subjects.length).toBeGreaterThanOrEqual(3);

    const mat = subjects.find((s) => s.code === 'MAT');
    expect(mat).toBeDefined();

    const topics = await repo.getTopics(mat?.id);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some((t) => t.name.includes('Odd Man Out'))).toBe(true);
  });

  it('creates, retrieves, duplicates, and deletes a paper', async () => {
    const newPaper = await repo.createPaper({
      title: 'Unit Test Paper',
      description: 'Test paper description',
      duration_minutes: 45,
      total_marks: 25,
      negative_marking_per_question: 0.25,
      is_published: true,
    });

    expect(newPaper.id).toBeDefined();
    expect(newPaper.title).toBe('Unit Test Paper');

    // Add a question to this paper
    const q = await repo.addQuestion({
      paper_id: newPaper.id,
      question_number: 1,
      question_text: 'What is 5 + 7?',
      marks: 2.5,
      explanation: '5 + 7 = 12',
      options: [
        { option_label: 'A', option_text: '10', is_correct: false },
        { option_label: 'B', option_text: '12', is_correct: true },
        { option_label: 'C', option_text: '14', is_correct: false },
        { option_label: 'D', option_text: '15', is_correct: false },
      ],
    });

    expect(q.id).toBeDefined();
    expect(q.options.length).toBe(4);

    // Fetch paper and check question count
    const fetched = await repo.getPaperById(newPaper.id);
    expect(fetched?.questions?.length).toBe(1);

    // Duplicate paper
    const duplicated = await repo.duplicatePaper(newPaper.id, 'Unit Test Paper Clone');
    expect(duplicated).toBeDefined();
    expect(duplicated?.title).toBe('Unit Test Paper Clone');

    const dupFetched = await repo.getPaperById(duplicated!.id);
    expect(dupFetched?.questions?.length).toBe(1);

    // Delete original and duplicate
    await repo.deletePaper(newPaper.id);
    await repo.deletePaper(duplicated!.id);

    const deleted = await repo.getPaperById(newPaper.id);
    expect(deleted).toBeNull();
  });

  it('runs an end-to-end exam attempt flow with answer saving, submission, and revision tracking', async () => {
    // 1. Get starter paper
    const papers = await repo.getPapers();
    const starter = papers[0];
    expect(starter).toBeDefined();

    // 2. Create attempt for student
    const studentId = 'test-student-unit';
    const attempt = await repo.createAttempt(starter.id, studentId);
    expect(attempt.status).toBe('in_progress');

    // 3. Save an answer for question 1
    const paperWithQ = await repo.getPaperById(starter.id);
    const q1 = paperWithQ!.questions![0];
    const correctOpt = q1.options.find((o) => o.is_correct);

    await repo.saveAttemptAnswer(
      attempt.id,
      q1.id,
      correctOpt!.id,
      correctOpt!.option_label,
      false,
      15
    );

    // 4. Submit attempt
    const submitted = await repo.submitAttempt(attempt.id);
    expect(submitted.status).toBe('submitted');
    expect(submitted.total_score).toBeGreaterThan(0);
    expect(submitted.correct_count).toBeGreaterThanOrEqual(1);
    expect(submitted.paper_snapshot).toBeDefined();
    expect(submitted.paper_snapshot?.questions.length).toBeGreaterThan(0);

    // 5. Check revision items were generated for missed questions
    const revisions = await repo.getRevisionItems(studentId);
    expect(revisions.length).toBeGreaterThan(0);
  });
});
