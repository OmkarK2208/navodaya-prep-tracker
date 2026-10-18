-- ============================================================================
-- Navodaya Prep Tracker: Complete Database Setup (Schema + Seed Data)
-- Copy and paste this ENTIRE file into Supabase SQL Editor and click RUN
-- ============================================================================

-- Enable pgcrypto for UUID generation
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
    instructions TEXT,
    explanation TEXT,
    is_uncertain BOOLEAN NOT NULL DEFAULT false,
    uncertainty_reason TEXT,
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
    CONSTRAINT uq_question_option UNIQUE (question_id, option_label)
);

-- 7. Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'abandoned')) DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    score NUMERIC(6, 2) DEFAULT 0.00,
    percentage NUMERIC(5, 2) DEFAULT 0.00,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    paper_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Attempt Answers Table
CREATE TABLE IF NOT EXISTS public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
    selected_option_label TEXT,
    is_correct BOOLEAN,
    is_marked_for_review BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INTEGER DEFAULT 0,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

-- 9. Study Sessions Table
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('exam', 'review', 'revision')),
    reference_id UUID,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Revision Notebook Table
CREATE TABLE IF NOT EXISTS public.revision_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
    mastered BOOLEAN NOT NULL DEFAULT false,
    student_note TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_question_revision UNIQUE (student_id, question_id)
);

-- ============================================================================
-- Row Level Security (RLS) Policies
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

-- Helper security functions
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
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Subjects and Topics Policies (Readable by all, manageable by Admin)
DROP POLICY IF EXISTS "Subjects are readable by authenticated users" ON public.subjects;
CREATE POLICY "Subjects are readable by authenticated users"
ON public.subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Subjects manageable by admin" ON public.subjects;
CREATE POLICY "Subjects manageable by admin"
ON public.subjects FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Topics are readable by authenticated users" ON public.topics;
CREATE POLICY "Topics are readable by authenticated users"
ON public.topics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Topics manageable by admin" ON public.topics;
CREATE POLICY "Topics manageable by admin"
ON public.topics FOR ALL TO authenticated USING (public.is_admin());

-- Papers Policies
DROP POLICY IF EXISTS "Published papers are viewable by students" ON public.papers;
CREATE POLICY "Published papers are viewable by students"
ON public.papers FOR SELECT TO authenticated
USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin can manage all papers" ON public.papers;
CREATE POLICY "Admin can manage all papers"
ON public.papers FOR ALL TO authenticated USING (public.is_admin());

-- Questions & Options Policies
DROP POLICY IF EXISTS "Questions viewable for accessible papers" ON public.questions;
CREATE POLICY "Questions viewable for accessible papers"
ON public.questions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.papers WHERE id = questions.paper_id AND (is_published = true OR public.is_admin())
));

DROP POLICY IF EXISTS "Admin can manage all questions" ON public.questions;
CREATE POLICY "Admin can manage all questions"
ON public.questions FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Options viewable without answers for students in active exam" ON public.question_options;
CREATE POLICY "Options viewable without answers for students in active exam"
ON public.question_options FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.questions q
  JOIN public.papers p ON p.id = q.paper_id
  WHERE q.id = question_options.question_id AND (p.is_published = true OR public.is_admin())
));

DROP POLICY IF EXISTS "Admin can manage all question options" ON public.question_options;
CREATE POLICY "Admin can manage all question options"
ON public.question_options FOR ALL TO authenticated USING (public.is_admin());

-- Exam Attempts & Answers Policies
DROP POLICY IF EXISTS "Students can view their own attempts" ON public.exam_attempts;
CREATE POLICY "Students can view their own attempts"
ON public.exam_attempts FOR SELECT TO authenticated
USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can create and update their own attempts" ON public.exam_attempts;
CREATE POLICY "Students can create and update their own attempts"
ON public.exam_attempts FOR ALL TO authenticated
USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can manage their own answers" ON public.attempt_answers;
CREATE POLICY "Students can manage their own answers"
ON public.attempt_answers FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exam_attempts
  WHERE id = attempt_answers.attempt_id AND (student_id = auth.uid() OR public.is_admin())
));

-- Study Sessions & Revision Items Policies
DROP POLICY IF EXISTS "Students can manage own study sessions" ON public.study_sessions;
CREATE POLICY "Students can manage own study sessions"
ON public.study_sessions FOR ALL TO authenticated
USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can manage own revision items" ON public.revision_items;
CREATE POLICY "Students can manage own revision items"
ON public.revision_items FOR ALL TO authenticated
USING (student_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- Default Starter Seed Data: Subjects & Topics
-- ============================================================================

INSERT INTO public.subjects (id, name, code, description, display_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Mental Ability Test', 'MAT', 'Section 1: Non-Verbal Reasoning, Pattern Completion, and Visual Puzzles (40 questions, 50 marks)', 1),
  ('22222222-2222-2222-2222-222222222222', 'Arithmetic Test', 'MATH', 'Section 2: Mathematical Concepts, Numbers, Operations, and Word Problems (20 questions, 25 marks)', 2),
  ('33333333-3333-3333-3333-333333333333', 'Language Test', 'LANG', 'Section 3: Reading Comprehension Passages and Grammar (20 questions, 25 marks)', 3)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Insert Default Topics for Mental Ability
INSERT INTO public.topics (subject_id, name, description)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Odd Man Out', 'Identify the one figure that differs from the others'),
  ('11111111-1111-1111-1111-111111111111', 'Figure Matching', 'Find the exact replica of the question figure'),
  ('11111111-1111-1111-1111-111111111111', 'Pattern Completion', 'Complete the missing quadrant of the given pattern'),
  ('11111111-1111-1111-1111-111111111111', 'Figure Series Completion', 'Identify the next figure in a sequence of three figures'),
  ('11111111-1111-1111-1111-111111111111', 'Analogy', 'Understand the relationship between two figures and apply it to a third'),
  ('11111111-1111-1111-1111-111111111111', 'Geometrical Figure Completion', 'Complete a triangle, square, or circle'),
  ('11111111-1111-1111-1111-111111111111', 'Mirror Imaging', 'Find the mirror reflection of the figure'),
  ('11111111-1111-1111-1111-111111111111', 'Punched Hole Pattern', 'Determine how a folded and punched paper unfolds'),
  ('11111111-1111-1111-1111-111111111111', 'Space Visualization', 'Assemble cutout pieces into a complete figure'),
  ('11111111-1111-1111-1111-111111111111', 'Embedded Figure', 'Find which option hides the question figure inside it')
ON CONFLICT DO NOTHING;

-- Insert Default Topics for Arithmetic
INSERT INTO public.topics (subject_id, name, description)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Number & Numeric System', 'Place value, face value, predecessor, successor, and prime numbers'),
  ('22222222-2222-2222-2222-222222222222', 'Four Fundamental Operations', 'Addition, subtraction, multiplication, and division of whole numbers'),
  ('22222222-2222-2222-2222-222222222222', 'Fractions & Operations', 'Proper, improper, mixed fractions, addition, and comparison'),
  ('22222222-2222-2222-2222-222222222222', 'Factors & Multiples', 'Properties of factors, multiples, prime factorization'),
  ('22222222-2222-2222-2222-222222222222', 'LCM and HCF', 'Lowest common multiple and highest common factor problems'),
  ('22222222-2222-2222-2222-222222222222', 'Decimals & Operations', 'Decimal conversions and operations'),
  ('22222222-2222-2222-2222-222222222222', 'Measurement Units', 'Mass, length, capacity, money, and time conversions'),
  ('22222222-2222-2222-2222-222222222222', 'Distance, Time and Speed', 'Train problems, speed conversions, and travel durations'),
  ('22222222-2222-2222-2222-222222222222', 'Simplification & BODMAS', 'Evaluating arithmetic expressions with brackets and orders'),
  ('22222222-2222-2222-2222-222222222222', 'Percentage & Applications', 'Finding percentage, discount, and rate'),
  ('22222222-2222-2222-2222-222222222222', 'Profit and Loss', 'Cost price, selling price, gain %, loss %'),
  ('22222222-2222-2222-2222-222222222222', 'Simple Interest', 'Principal, rate, time, and simple interest calculations'),
  ('22222222-2222-2222-2222-222222222222', 'Perimeter, Area and Volume', 'Rectangles, squares, cuboids, and tiles')
ON CONFLICT DO NOTHING;

-- Insert Default Topics for Language
INSERT INTO public.topics (subject_id, name, description)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Reading Comprehension', 'Understanding passages, answering main idea and factual questions'),
  ('33333333-3333-3333-3333-333333333333', 'Vocabulary & Synonyms', 'Word meanings, opposites, and context clues'),
  ('33333333-3333-3333-3333-333333333333', 'Grammar & Usage', 'Tenses, prepositions, singular/plural, and parts of speech')
ON CONFLICT DO NOTHING;

-- Storage Bucket for Uploaded Papers
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-papers', 'exam-papers', false)
ON CONFLICT (id) DO NOTHING;
