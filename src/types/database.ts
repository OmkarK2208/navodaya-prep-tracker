// TypeScript types matching PostgreSQL database schema

export type UserRole = 'admin' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  target_exam_year?: number;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // MAT, MATH, LANG
  description?: string;
  display_order: number;
  created_at?: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  created_at?: string;
  subject?: Subject;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_label: 'A' | 'B' | 'C' | 'D';
  option_text: string;
  option_image_url?: string;
  is_correct?: boolean; // Stripped for students during exam
}

export interface Question {
  id: string;
  paper_id: string;
  subject_id?: string;
  topic_id?: string;
  question_number: number;
  question_text: string;
  question_image_url?: string;
  marks: number;
  explanation?: string;
  is_ai_extracted?: boolean;
  options: QuestionOption[];
  subject?: Subject;
  topic?: Topic;
  created_at?: string;
}

export interface Paper {
  id: string;
  title: string;
  description?: string;
  pdf_path?: string;
  duration_minutes: number;
  total_marks: number;
  negative_marking_per_question: number;
  is_published: boolean;
  available_from?: string | null;
  available_until?: string | null;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  questions?: Question[];
  question_count?: number;
  attempts_count?: number;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'timed_out' | 'abandoned';

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string | null;
  selected_option_label?: string | null;
  is_marked_for_review: boolean;
  is_correct?: boolean | null;
  marks_obtained: number;
  time_spent_seconds: number;
  saved_at: string;
}

export interface ExamAttempt {
  id: string;
  paper_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string | null;
  time_spent_seconds: number;
  status: AttemptStatus;
  total_score: number;
  max_marks: number;
  percentage: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  accuracy_percentage: number;
  paper_snapshot?: PaperSnapshot | null;
  paper?: Paper;
  answers?: Record<string, AttemptAnswer>; // key: question_id
  created_at?: string;
}

export interface PaperSnapshot {
  paper_id: string;
  paper_title: string;
  duration_minutes: number;
  total_marks: number;
  negative_marking_per_question: number;
  questions: Array<{
    id: string;
    question_number: number;
    question_text: string;
    marks: number;
    explanation?: string;
    subject_id?: string;
    subject_name?: string;
    subject_code?: string;
    topic_id?: string;
    topic_name?: string;
    options: Array<{
      id: string;
      option_label: 'A' | 'B' | 'C' | 'D';
      option_text: string;
      is_correct: boolean;
    }>;
  }>;
}

export interface StudySession {
  id: string;
  student_id: string;
  session_type: 'exam' | 'solution_review' | 'revision' | 'practice';
  reference_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  active_duration_seconds: number;
  last_heartbeat_at: string;
}

export interface RevisionItem {
  id: string;
  student_id: string;
  question_id: string;
  last_attempt_id?: string | null;
  missed_count: number;
  mastered: boolean;
  last_reviewed_at?: string | null;
  created_at: string;
  question?: Question;
}

export interface SubjectAnalytics {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_questions: number;
  attempted_count: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  total_marks_possible: number;
  marks_obtained: number;
  accuracy_percentage: number;
  average_time_per_question_seconds: number;
}

export interface StudentDashboardStats {
  today_available_papers_count: number;
  today_completed_papers_count: number;
  current_streak_days: number;
  total_papers_attempted: number;
  latest_score: number | null;
  best_score: number | null;
  average_score: number | null;
  total_questions_solved: number;
  overall_accuracy_percentage: number;
  study_time_today_seconds: number;
  subject_progress: SubjectAnalytics[];
  recent_attempts: ExamAttempt[];
  weak_topics: Array<{
    topic_id: string;
    topic_name: string;
    subject_name: string;
    missed_count: number;
  }>;
  weekly_performance: Array<{
    day: string;
    date: string;
    score: number;
    accuracy: number;
    papers_taken: number;
  }>;
}
