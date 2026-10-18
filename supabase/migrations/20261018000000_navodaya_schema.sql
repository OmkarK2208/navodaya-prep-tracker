-- ============================================================================
-- Navodaya Prep Tracker: PostgreSQL Schema & RLS Policies
-- Compatible with Supabase PostgreSQL (Standard & Extension-enabled)
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')) DEFAULT 'student',
    target_exam_year INTEGER DEFAULT 2026,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_subject_topic UNIQUE (subject_id, name)
);

-- 4. Papers Table
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    pdf_path TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    negative_marking_per_question NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    is_published BOOLEAN NOT NULL DEFAULT false,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    marks NUMERIC(4, 2) NOT NULL DEFAULT 1.25,
    explanation TEXT,
    is_ai_extracted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_paper_question_number UNIQUE (paper_id, question_number)
);

-- 6. Question Options Table
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_label TEXT NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D')),
    option_text TEXT NOT NULL,
    option_image_url TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_question_option_label UNIQUE (question_id, option_label)
);

-- 7. Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'timed_out', 'abandoned')) DEFAULT 'in_progress',
    total_score NUMERIC(6, 2) DEFAULT 0.00,
    max_marks NUMERIC(6, 2) DEFAULT 100.00,
    percentage NUMERIC(5, 2) DEFAULT 0.00,
    total_questions INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    accuracy_percentage NUMERIC(5, 2) DEFAULT 0.00,
    paper_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Attempt Answers Table
CREATE TABLE IF NOT EXISTS public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
    selected_option_label TEXT,
    is_marked_for_review BOOLEAN NOT NULL DEFAULT false,
    is_correct BOOLEAN,
    marks_obtained NUMERIC(4, 2) DEFAULT 0.00,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

-- 9. Study Sessions Table (Active engagement tracking)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('exam', 'solution_review', 'revision', 'practice')),
    reference_id UUID,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    active_duration_seconds INTEGER NOT NULL DEFAULT 0,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Revision Items (Missed and flagged questions for targeted revision)
CREATE TABLE IF NOT EXISTS public.revision_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    last_attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
    missed_count INTEGER NOT NULL DEFAULT 1,
    mastered BOOLEAN NOT NULL DEFAULT false,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_question_revision UNIQUE (student_id, question_id)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON public.questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_paper_id ON public.exam_attempts(paper_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON public.attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON public.study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_revision_items_student ON public.revision_items(student_id, mastered);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin full access to profiles"
ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Subjects & Topics Policies
CREATE POLICY "Anyone authenticated can view subjects"
ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Anyone authenticated can view topics"
ON public.topics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage topics"
ON public.topics FOR ALL TO authenticated USING (public.is_admin());

-- Papers Policies
CREATE POLICY "Admins full access to papers"
ON public.papers FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view published papers in window"
ON public.papers FOR SELECT TO authenticated USING (
    is_published = true AND
    (available_from IS NULL OR available_from <= timezone('utc'::text, now())) AND
    (available_until IS NULL OR available_until >= timezone('utc'::text, now()))
);

-- Questions Policies
CREATE POLICY "Admins full access to questions"
ON public.questions FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view questions for available papers"
ON public.questions FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.papers p
        WHERE p.id = questions.paper_id AND p.is_published = true
    )
);

-- Question Options Policies
-- (Notice: is_correct is protected at the API layer for active attempts)
CREATE POLICY "Admins full access to question options"
ON public.question_options FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view question options"
ON public.question_options FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.questions q
        JOIN public.papers p ON p.id = q.paper_id
        WHERE q.id = question_options.question_id AND p.is_published = true
    )
);

-- Exam Attempts Policies
CREATE POLICY "Admins can view all exam attempts"
ON public.exam_attempts FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view own attempts"
ON public.exam_attempts FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can insert own attempts"
ON public.exam_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own attempts"
ON public.exam_attempts FOR UPDATE TO authenticated USING (student_id = auth.uid());

-- Attempt Answers Policies
CREATE POLICY "Admins can view all attempt answers"
ON public.attempt_answers FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view and manage own attempt answers"
ON public.attempt_answers FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        WHERE a.id = attempt_answers.attempt_id AND a.student_id = auth.uid()
    )
);

-- Study Sessions Policies
CREATE POLICY "Admins can view all study sessions"
ON public.study_sessions FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view and manage own study sessions"
ON public.study_sessions FOR ALL TO authenticated USING (student_id = auth.uid());

-- Revision Items Policies
CREATE POLICY "Admins can view all revision items"
ON public.revision_items FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Students can view and update own revision items"
ON public.revision_items FOR ALL TO authenticated USING (student_id = auth.uid());

-- Storage Bucket Setup for Private Question Paper PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-papers', 'exam-papers', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload paper PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exam-papers' AND public.is_admin());

CREATE POLICY "Admins can manage paper PDFs"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'exam-papers' AND public.is_admin());

CREATE POLICY "Students can view paper PDFs of published papers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exam-papers');
