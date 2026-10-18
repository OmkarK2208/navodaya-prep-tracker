-- ============================================================================
-- Navodaya Prep Tracker: Starter Seed Data
-- ============================================================================

-- 1. Insert Default Subjects
INSERT INTO public.subjects (id, name, code, description, display_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Mental Ability Test', 'MAT', 'Section 1: Non-Verbal Reasoning, Pattern Completion, and Visual Puzzles (40 questions, 50 marks)', 1),
  ('22222222-2222-2222-2222-222222222222', 'Arithmetic Test', 'MATH', 'Section 2: Mathematical Concepts, Numbers, Operations, and Word Problems (20 questions, 25 marks)', 2),
  ('33333333-3333-3333-3333-333333333333', 'Language Test', 'LANG', 'Section 3: Reading Comprehension Passages and Grammar (20 questions, 25 marks)', 3)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- 2. Insert Default Topics for Mental Ability
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

-- 3. Insert Default Topics for Arithmetic
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

-- 4. Insert Default Topics for Language
INSERT INTO public.topics (subject_id, name, description)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Reading Comprehension', 'Understanding passages, answering main idea and factual questions'),
  ('33333333-3333-3333-3333-333333333333', 'Vocabulary & Synonyms', 'Word meanings, opposites, and context clues'),
  ('33333333-3333-3333-3333-333333333333', 'Grammar & Usage', 'Tenses, prepositions, singular/plural, and parts of speech')
ON CONFLICT DO NOTHING;
