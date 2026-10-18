import { describe, it, expect } from 'vitest';
import { evaluateAttempt } from '../scoring';
import { Paper, Question } from '@/types/database';

describe('Exam Scoring Engine', () => {
  const mockPaper: Paper = {
    id: 'paper-1',
    title: 'Navodaya Mock Test 1',
    duration_minutes: 120,
    total_marks: 5,
    negative_marking_per_question: 0.25,
    is_published: true,
    created_at: new Date().toISOString(),
  };

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      paper_id: 'paper-1',
      question_number: 1,
      question_text: 'Find the odd one out: 2, 4, 6, 9',
      marks: 1.25,
      options: [
        { id: 'opt1', question_id: 'q1', option_label: 'A', option_text: '2', is_correct: false },
        { id: 'opt2', question_id: 'q1', option_label: 'B', option_text: '4', is_correct: false },
        { id: 'opt3', question_id: 'q1', option_label: 'C', option_text: '6', is_correct: false },
        { id: 'opt4', question_id: 'q1', option_label: 'D', option_text: '9', is_correct: true },
      ],
    },
    {
      id: 'q2',
      paper_id: 'paper-1',
      question_number: 2,
      question_text: 'What is the LCM of 12 and 18?',
      marks: 1.25,
      options: [
        { id: 'opt5', question_id: 'q2', option_label: 'A', option_text: '36', is_correct: true },
        { id: 'opt6', question_id: 'q2', option_label: 'B', option_text: '24', is_correct: false },
        { id: 'opt7', question_id: 'q2', option_label: 'C', option_text: '48', is_correct: false },
        { id: 'opt8', question_id: 'q2', option_label: 'D', option_text: '72', is_correct: false },
      ],
    },
    {
      id: 'q3',
      paper_id: 'paper-1',
      question_number: 3,
      question_text: 'Choose the antonym of "Generous":',
      marks: 1.25,
      options: [
        { id: 'opt9', question_id: 'q3', option_label: 'A', option_text: 'Kind', is_correct: false },
        { id: 'opt10', question_id: 'q3', option_label: 'B', option_text: 'Miserly', is_correct: true },
        { id: 'opt11', question_id: 'q3', option_label: 'C', option_text: 'Helpful', is_correct: false },
        { id: 'opt12', question_id: 'q3', option_label: 'D', option_text: 'Noble', is_correct: false },
      ],
    },
    {
      id: 'q4',
      paper_id: 'paper-1',
      question_number: 4,
      question_text: 'Unanswered Question',
      marks: 1.25,
      options: [
        { id: 'opt13', question_id: 'q4', option_label: 'A', option_text: 'A', is_correct: true },
        { id: 'opt14', question_id: 'q4', option_label: 'B', option_text: 'B', is_correct: false },
      ],
    },
  ];

  it('correctly calculates score with 1 correct, 1 wrong with negative marking, and 2 unanswered', () => {
    const submittedAnswers = {
      q1: { selected_option_id: 'opt4' }, // Correct: +1.25
      q2: { selected_option_id: 'opt6' }, // Wrong: -0.25
      // q3 and q4: unanswered: 0
    };

    const result = evaluateAttempt(mockPaper, mockQuestions, submittedAnswers as any);

    expect(result.correct_count).toBe(1);
    expect(result.wrong_count).toBe(1);
    expect(result.unanswered_count).toBe(2);
    // 1.25 - 0.25 = 1.00
    expect(result.total_score).toBe(1.00);
    expect(result.max_marks).toBe(5.00);
    expect(result.percentage).toBe(20.00); // 1.00 / 5.00 = 20%
    expect(result.accuracy_percentage).toBe(50.00); // 1 / 2 attempted = 50%
    expect(result.missed_question_ids).toContain('q2');
    expect(result.missed_question_ids).toContain('q3');
    expect(result.missed_question_ids).toContain('q4');
    expect(result.missed_question_ids).not.toContain('q1');
  });

  it('preserves an immutable paper snapshot with options and correctness', () => {
    const result = evaluateAttempt(mockPaper, mockQuestions, {});
    expect(result.paper_snapshot.paper_id).toBe('paper-1');
    expect(result.paper_snapshot.questions.length).toBe(4);
    expect(result.paper_snapshot.questions[0].options[3].is_correct).toBe(true);
  });
});
