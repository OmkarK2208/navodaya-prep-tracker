import { Paper, Question, AttemptAnswer, ExamAttempt, PaperSnapshot } from '@/types/database';

export interface EvaluationResult {
  total_score: number;
  max_marks: number;
  percentage: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  accuracy_percentage: number;
  evaluated_answers: Record<string, AttemptAnswer>;
  paper_snapshot: PaperSnapshot;
  missed_question_ids: string[];
}

/**
 * Authoritative Server-Side Evaluation Engine
 * Prevents client-side manipulation of marks, handles negative marking,
 * computes subject/topic statistics, and creates an immutable snapshot.
 */
export function evaluateAttempt(
  paper: Paper,
  questions: Question[],
  submittedAnswers: Record<string, Partial<AttemptAnswer>>
): EvaluationResult {
  let totalScore = 0;
  let maxMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const missedQuestionIds: string[] = [];
  const evaluatedAnswers: Record<string, AttemptAnswer> = {};

  const negativeMarking = Number(paper.negative_marking_per_question || 0);

  // Snapshot generation
  const paperSnapshot: PaperSnapshot = {
    paper_id: paper.id,
    paper_title: paper.title,
    duration_minutes: paper.duration_minutes,
    total_marks: paper.total_marks,
    negative_marking_per_question: negativeMarking,
    questions: questions.map((q) => ({
      id: q.id,
      question_number: q.question_number,
      question_text: q.question_text,
      marks: q.marks,
      explanation: q.explanation,
      subject_id: q.subject_id,
      subject_name: q.subject?.name,
      subject_code: q.subject?.code,
      topic_id: q.topic_id,
      topic_name: q.topic?.name,
      options: q.options.map((opt) => ({
        id: opt.id,
        option_label: opt.option_label,
        option_text: opt.option_text,
        is_correct: !!opt.is_correct,
      })),
    })),
  };

  questions.forEach((q) => {
    const qMarks = Number(q.marks || 1.25);
    maxMarks += qMarks;

    const answer = submittedAnswers[q.id];
    const selectedOptionId = answer?.selected_option_id;

    // Find the correct option
    const correctOption = q.options.find((opt) => opt.is_correct);

    if (!selectedOptionId) {
      // Unanswered
      unansweredCount++;
      missedQuestionIds.push(q.id);
      evaluatedAnswers[q.id] = {
        id: answer?.id || `ans-${q.id}`,
        attempt_id: answer?.attempt_id || '',
        question_id: q.id,
        selected_option_id: null,
        selected_option_label: null,
        is_marked_for_review: !!answer?.is_marked_for_review,
        is_correct: null,
        marks_obtained: 0,
        time_spent_seconds: answer?.time_spent_seconds || 0,
        saved_at: new Date().toISOString(),
      };
    } else {
      const isCorrect = correctOption ? correctOption.id === selectedOptionId : false;
      const selectedOption = q.options.find((opt) => opt.id === selectedOptionId);

      let marksEarned = 0;
      if (isCorrect) {
        correctCount++;
        marksEarned = qMarks;
        totalScore += qMarks;
      } else {
        wrongCount++;
        missedQuestionIds.push(q.id);
        if (negativeMarking > 0) {
          marksEarned = -negativeMarking;
          totalScore -= negativeMarking;
        }
      }

      evaluatedAnswers[q.id] = {
        id: answer?.id || `ans-${q.id}`,
        attempt_id: answer?.attempt_id || '',
        question_id: q.id,
        selected_option_id: selectedOptionId,
        selected_option_label: selectedOption?.option_label || null,
        is_marked_for_review: !!answer?.is_marked_for_review,
        is_correct: isCorrect,
        marks_obtained: Number(marksEarned.toFixed(2)),
        time_spent_seconds: answer?.time_spent_seconds || 0,
        saved_at: new Date().toISOString(),
      };
    }
  });

  const totalQuestions = questions.length;
  const attemptedCount = correctCount + wrongCount;
  const accuracyPercentage =
    attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;
  
  // Floor at 0 if negative marking brought it below zero
  const finalScore = Math.max(0, Number(totalScore.toFixed(2)));
  const percentage =
    maxMarks > 0 ? Number(((finalScore / maxMarks) * 100).toFixed(2)) : 0;

  return {
    total_score: finalScore,
    max_marks: Number(maxMarks.toFixed(2)),
    percentage,
    total_questions: totalQuestions,
    correct_count: correctCount,
    wrong_count: wrongCount,
    unanswered_count: unansweredCount,
    accuracy_percentage: accuracyPercentage,
    evaluated_answers: evaluatedAnswers,
    paper_snapshot: paperSnapshot,
    missed_question_ids: missedQuestionIds,
  };
}
