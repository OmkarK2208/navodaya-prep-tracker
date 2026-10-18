import {
  Paper,
  Question,
  QuestionOption,
  Subject,
  Topic,
  ExamAttempt,
  AttemptAnswer,
  StudySession,
  RevisionItem,
  StudentDashboardStats,
  Profile,
} from '@/types/database';

export interface CreatePaperInput {
  title: string;
  description?: string;
  pdf_path?: string;
  duration_minutes: number;
  total_marks: number;
  negative_marking_per_question: number;
  is_published?: boolean;
  available_from?: string | null;
  available_until?: string | null;
  created_by?: string;
}

export interface CreateQuestionInput {
  paper_id: string;
  subject_id?: string;
  topic_id?: string;
  question_number: number;
  question_text: string;
  question_image_url?: string;
  marks: number;
  explanation?: string;
  options: Array<{
    option_label: 'A' | 'B' | 'C' | 'D';
    option_text: string;
    option_image_url?: string;
    is_correct: boolean;
  }>;
}

export interface IDataRepository {
  // Profiles
  getProfile(userId: string): Promise<Profile | null>;
  getProfiles(): Promise<Profile[]>;
  saveProfile(profile: Profile): Promise<Profile>;

  // Subjects & Topics
  getSubjects(): Promise<Subject[]>;
  getTopics(subjectId?: string): Promise<Topic[]>;

  // Papers
  getPapers(filter?: { publishedOnly?: boolean; studentId?: string }): Promise<Paper[]>;
  getPaperById(paperId: string, options?: { hideCorrectAnswers?: boolean }): Promise<Paper | null>;
  createPaper(paper: CreatePaperInput): Promise<Paper>;
  updatePaper(paperId: string, updates: Partial<Paper>): Promise<Paper | null>;
  deletePaper(paperId: string): Promise<boolean>;
  duplicatePaper(paperId: string, newTitle?: string): Promise<Paper | null>;

  // Questions
  addQuestion(question: CreateQuestionInput): Promise<Question>;
  updateQuestion(questionId: string, updates: Partial<CreateQuestionInput>): Promise<Question | null>;
  deleteQuestion(questionId: string): Promise<boolean>;

  // Exam Attempts & Evaluation
  createAttempt(paperId: string, studentId: string): Promise<ExamAttempt>;
  getAttempt(attemptId: string): Promise<ExamAttempt | null>;
  getStudentAttempts(studentId: string): Promise<ExamAttempt[]>;
  saveAttemptAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
    selectedOptionLabel: string | null,
    isMarkedForReview: boolean,
    timeSpentSeconds?: number
  ): Promise<AttemptAnswer>;
  submitAttempt(attemptId: string): Promise<ExamAttempt>;

  // Study Sessions
  recordStudySession(
    studentId: string,
    sessionType: 'exam' | 'solution_review' | 'revision' | 'practice',
    activeDurationSeconds: number,
    referenceId?: string | null
  ): Promise<StudySession>;
  getStudentStudyTimeToday(studentId: string): Promise<number>;

  // Revision Items
  getRevisionItems(studentId: string): Promise<RevisionItem[]>;
  markRevisionItemMastered(itemId: string, mastered: boolean): Promise<boolean>;

  // Analytics
  getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats>;
}
