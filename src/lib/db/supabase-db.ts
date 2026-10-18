import {
  IDataRepository,
  CreatePaperInput,
  CreateQuestionInput,
} from './repository';
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
import { createAdminClient } from '../supabase/admin';
import { evaluateAttempt } from '../scoring';

export class SupabaseRepository implements IDataRepository {
  private getClient() {
    const client = createAdminClient();
    if (!client) {
      throw new Error('Supabase client is not configured or missing service role key.');
    }
    return client;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return data as Profile;
  }

  async getProfiles(): Promise<Profile[]> {
    const supabase = this.getClient();
    const { data } = await supabase.from('profiles').select('*');
    return (data || []) as Profile[];
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        target_exam_year: profile.target_exam_year,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  }

  async getSubjects(): Promise<Subject[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('display_order', { ascending: true });
    return (data || []) as Subject[];
  }

  async getTopics(subjectId?: string): Promise<Topic[]> {
    const supabase = this.getClient();
    let query = supabase.from('topics').select('*, subject:subjects(*)');
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    const { data } = await query;
    return (data || []) as Topic[];
  }

  async getPapers(filter?: { publishedOnly?: boolean; studentId?: string }): Promise<Paper[]> {
    const supabase = this.getClient();
    let query = supabase.from('papers').select('*, questions:questions(count)');
    if (filter?.publishedOnly) {
      query = query.eq('is_published', true);
    }
    const { data } = await query.order('created_at', { ascending: false });
    return (data || []).map((p: any) => ({
      ...p,
      question_count: p.questions?.[0]?.count || 0,
    })) as Paper[];
  }

  async getPaperById(
    paperId: string,
    options?: { hideCorrectAnswers?: boolean }
  ): Promise<Paper | null> {
    const supabase = this.getClient();
    const { data: paper, error } = await supabase
      .from('papers')
      .select('*')
      .eq('id', paperId)
      .single();
    if (error || !paper) return null;

    const { data: questions } = await supabase
      .from('questions')
      .select('*, options:question_options(*), subject:subjects(*), topic:topics(*)')
      .eq('paper_id', paperId)
      .order('question_number', { ascending: true });

    const processedQuestions = (questions || []).map((q: any) => {
      let optionsList = q.options || [];
      if (options?.hideCorrectAnswers) {
        optionsList = optionsList.map(({ is_correct, ...safe }: any) => safe);
      }
      return {
        ...q,
        options: optionsList,
      };
    });

    return {
      ...paper,
      questions: processedQuestions,
      question_count: processedQuestions.length,
    } as Paper;
  }

  async createPaper(paperInput: CreatePaperInput): Promise<Paper> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: paperInput.title,
        description: paperInput.description,
        pdf_path: paperInput.pdf_path,
        duration_minutes: paperInput.duration_minutes,
        total_marks: paperInput.total_marks,
        negative_marking_per_question: paperInput.negative_marking_per_question,
        is_published: !!paperInput.is_published,
        available_from: paperInput.available_from,
        available_until: paperInput.available_until,
        created_by: paperInput.created_by,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Paper;
  }

  async updatePaper(paperId: string, updates: Partial<Paper>): Promise<Paper | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('papers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paperId)
      .select()
      .single();
    if (error) return null;
    return data as Paper;
  }

  async deletePaper(paperId: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.from('papers').delete().eq('id', paperId);
    return !error;
  }

  async duplicatePaper(paperId: string, newTitle?: string): Promise<Paper | null> {
    const original = await this.getPaperById(paperId);
    if (!original) return null;

    const duplicated = await this.createPaper({
      title: newTitle || `${original.title} (Copy)`,
      description: original.description,
      duration_minutes: original.duration_minutes,
      total_marks: original.total_marks,
      negative_marking_per_question: original.negative_marking_per_question,
      is_published: false,
    });

    if (original.questions) {
      for (const q of original.questions) {
        await this.addQuestion({
          paper_id: duplicated.id,
          subject_id: q.subject_id,
          topic_id: q.topic_id,
          question_number: q.question_number,
          question_text: q.question_text,
          marks: q.marks,
          explanation: q.explanation,
          options: q.options.map((opt) => ({
            option_label: opt.option_label,
            option_text: opt.option_text,
            is_correct: !!opt.is_correct,
          })),
        });
      }
    }

    return duplicated;
  }

  async addQuestion(questionInput: CreateQuestionInput): Promise<Question> {
    const supabase = this.getClient();
    const { data: q, error: qErr } = await supabase
      .from('questions')
      .insert({
        paper_id: questionInput.paper_id,
        subject_id: questionInput.subject_id,
        topic_id: questionInput.topic_id,
        question_number: questionInput.question_number,
        question_text: questionInput.question_text,
        question_image_url: questionInput.question_image_url,
        marks: questionInput.marks,
        explanation: questionInput.explanation,
      })
      .select()
      .single();
    if (qErr) throw qErr;

    const optionsToInsert = questionInput.options.map((opt) => ({
      question_id: q.id,
      option_label: opt.option_label,
      option_text: opt.option_text,
      option_image_url: opt.option_image_url,
      is_correct: opt.is_correct,
    }));

    const { data: opts, error: optErr } = await supabase
      .from('question_options')
      .insert(optionsToInsert)
      .select();
    if (optErr) throw optErr;

    return {
      ...q,
      options: opts,
    } as Question;
  }

  async updateQuestion(questionId: string, updates: Partial<CreateQuestionInput>): Promise<Question | null> {
    const supabase = this.getClient();
    const updatePayload: any = {};
    if (updates.subject_id !== undefined) updatePayload.subject_id = updates.subject_id;
    if (updates.topic_id !== undefined) updatePayload.topic_id = updates.topic_id;
    if (updates.question_number !== undefined) updatePayload.question_number = updates.question_number;
    if (updates.question_text !== undefined) updatePayload.question_text = updates.question_text;
    if (updates.marks !== undefined) updatePayload.marks = updates.marks;
    if (updates.explanation !== undefined) updatePayload.explanation = updates.explanation;

    const { data: q, error } = await supabase
      .from('questions')
      .update(updatePayload)
      .eq('id', questionId)
      .select()
      .single();
    if (error || !q) return null;

    if (updates.options) {
      await supabase.from('question_options').delete().eq('question_id', questionId);
      const opts = updates.options.map((opt) => ({
        question_id: questionId,
        option_label: opt.option_label,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
      }));
      await supabase.from('question_options').insert(opts);
    }

    return q as Question;
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    return !error;
  }

  async createAttempt(paperId: string, studentId: string): Promise<ExamAttempt> {
    const supabase = this.getClient();
    const paper = await this.getPaperById(paperId);
    if (!paper) throw new Error('Paper not found');

    const { data: existing } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('paper_id', paperId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (existing) {
      return this.getAttempt(existing.id) as Promise<ExamAttempt>;
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .insert({
        paper_id: paperId,
        student_id: studentId,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        max_marks: paper.total_marks,
        total_questions: paper.question_count || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return this.getAttempt(data.id) as Promise<ExamAttempt>;
  }

  async getAttempt(attemptId: string): Promise<ExamAttempt | null> {
    const supabase = this.getClient();
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .select('*, paper:papers(*)')
      .eq('id', attemptId)
      .single();
    if (error || !attempt) return null;

    const { data: answers } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    const answersMap: Record<string, AttemptAnswer> = {};
    (answers || []).forEach((a: any) => {
      answersMap[a.question_id] = a;
    });

    return {
      ...attempt,
      answers: answersMap,
    } as ExamAttempt;
  }

  async getStudentAttempts(studentId: string): Promise<ExamAttempt[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('exam_attempts')
      .select('*, paper:papers(*)')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });
    return (data || []) as ExamAttempt[];
  }

  async saveAttemptAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
    selectedOptionLabel: string | null,
    isMarkedForReview: boolean,
    timeSpentSeconds: number = 0
  ): Promise<AttemptAnswer> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('attempt_answers')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        selected_option_label: selectedOptionLabel,
        is_marked_for_review: isMarkedForReview,
        time_spent_seconds: timeSpentSeconds,
        saved_at: new Date().toISOString(),
      }, { onConflict: 'attempt_id,question_id' })
      .select()
      .single();
    if (error) throw error;
    return data as AttemptAnswer;
  }

  async submitAttempt(attemptId: string): Promise<ExamAttempt> {
    const supabase = this.getClient();
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status === 'submitted') return attempt;

    const paper = await this.getPaperById(attempt.paper_id);
    if (!paper || !paper.questions) throw new Error('Paper questions not found');

    const evaluation = evaluateAttempt(paper, paper.questions, attempt.answers || {});

    const started = new Date(attempt.started_at).getTime();
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - started) / 1000));

    // Update attempt
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from('exam_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        time_spent_seconds: elapsedSeconds,
        status: 'submitted',
        total_score: evaluation.total_score,
        max_marks: evaluation.max_marks,
        percentage: evaluation.percentage,
        total_questions: evaluation.total_questions,
        correct_count: evaluation.correct_count,
        wrong_count: evaluation.wrong_count,
        unanswered_count: evaluation.unanswered_count,
        accuracy_percentage: evaluation.accuracy_percentage,
        paper_snapshot: evaluation.paper_snapshot,
      })
      .eq('id', attemptId)
      .select('*, paper:papers(*)')
      .single();

    if (updateErr) throw updateErr;

    // Upsert evaluated answers
    for (const ea of Object.values(evaluation.evaluated_answers)) {
      await supabase.from('attempt_answers').upsert({
        attempt_id: attemptId,
        question_id: ea.question_id,
        selected_option_id: ea.selected_option_id,
        selected_option_label: ea.selected_option_label,
        is_marked_for_review: ea.is_marked_for_review,
        is_correct: ea.is_correct,
        marks_obtained: ea.marks_obtained,
        time_spent_seconds: ea.time_spent_seconds,
        saved_at: ea.saved_at,
      }, { onConflict: 'attempt_id,question_id' });
    }

    // Update revision items
    for (const qid of evaluation.missed_question_ids) {
      await supabase.from('revision_items').upsert({
        student_id: attempt.student_id,
        question_id: qid,
        last_attempt_id: attemptId,
        mastered: false,
      }, { onConflict: 'student_id,question_id' });
    }

    // Record study session
    await this.recordStudySession(attempt.student_id, 'exam', elapsedSeconds, attempt.id);

    return this.getAttempt(attemptId) as Promise<ExamAttempt>;
  }

  async recordStudySession(
    studentId: string,
    sessionType: 'exam' | 'solution_review' | 'revision' | 'practice',
    activeDurationSeconds: number,
    referenceId?: string | null
  ): Promise<StudySession> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        student_id: studentId,
        session_type: sessionType,
        reference_id: referenceId,
        started_at: new Date(Date.now() - activeDurationSeconds * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        active_duration_seconds: activeDurationSeconds,
      })
      .select()
      .single();
    if (error) throw error;
    return data as StudySession;
  }

  async getStudentStudyTimeToday(studentId: string): Promise<number> {
    const supabase = this.getClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('study_sessions')
      .select('active_duration_seconds')
      .eq('student_id', studentId)
      .gte('started_at', `${today}T00:00:00.000Z`);
    return (data || []).reduce((acc: number, s: any) => acc + (s.active_duration_seconds || 0), 0);
  }

  async getRevisionItems(studentId: string): Promise<RevisionItem[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('revision_items')
      .select('*, question:questions(*, options:question_options(*), subject:subjects(*), topic:topics(*))')
      .eq('student_id', studentId)
      .eq('mastered', false);
    return (data || []) as RevisionItem[];
  }

  async markRevisionItemMastered(itemId: string, mastered: boolean): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('revision_items')
      .update({
        mastered,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId);
    return !error;
  }

  async getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
    // When Supabase is connected, compute stats directly or fall back to repository interface
    const attempts = await this.getStudentAttempts(studentId);
    const submitted = attempts.filter((a) => a.status === 'submitted');
    const papers = await this.getPapers({ publishedOnly: true });
    const studyTimeToday = await this.getStudentStudyTimeToday(studentId);
    const subjects = await this.getSubjects();

    const scores = submitted.map((a) => Number(a.total_score || 0));
    const latestScore = submitted.length > 0 ? scores[0] : null;
    const bestScore = submitted.length > 0 ? Math.max(...scores) : null;
    const averageScore =
      submitted.length > 0
        ? Number((scores.reduce((s, v) => s + v, 0) / submitted.length).toFixed(1))
        : null;

    const totalSolved = submitted.reduce((sum, a) => sum + (a.correct_count + a.wrong_count), 0);
    const totalCorrect = submitted.reduce((sum, a) => sum + a.correct_count, 0);
    const accuracy =
      totalSolved > 0 ? Number(((totalCorrect / totalSolved) * 100).toFixed(1)) : 0;

    return {
      today_available_papers_count: papers.length,
      today_completed_papers_count: submitted.filter((a) =>
        (a.submitted_at || a.started_at).startsWith(new Date().toISOString().slice(0, 10))
      ).length,
      current_streak_days: submitted.length > 0 ? 1 : 0,
      total_papers_attempted: submitted.length,
      latest_score: latestScore,
      best_score: bestScore,
      average_score: averageScore,
      total_questions_solved: totalSolved,
      overall_accuracy_percentage: accuracy,
      study_time_today_seconds: studyTimeToday,
      subject_progress: subjects.map((s) => ({
        subject_id: s.id,
        subject_name: s.name,
        subject_code: s.code,
        total_questions: 0,
        attempted_count: 0,
        correct_count: 0,
        wrong_count: 0,
        unanswered_count: 0,
        total_marks_possible: 0,
        marks_obtained: 0,
        accuracy_percentage: 0,
        average_time_per_question_seconds: 0,
      })),
      recent_attempts: submitted.slice(0, 5),
      weak_topics: [],
      weekly_performance: [],
    };
  }
}
