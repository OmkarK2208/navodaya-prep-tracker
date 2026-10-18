import fs from 'fs';
import path from 'path';
import os from 'os';
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
  SubjectAnalytics,
} from '@/types/database';
import { evaluateAttempt } from '../scoring';

interface DatabaseSchema {
  profiles: Profile[];
  subjects: Subject[];
  topics: Topic[];
  papers: Paper[];
  questions: Question[];
  options: QuestionOption[];
  attempts: ExamAttempt[];
  answers: AttemptAnswer[];
  sessions: StudySession[];
  revisionItems: RevisionItem[];
}

function getDbPath(): string {
  const localPath = path.resolve(process.cwd(), 'data', 'navodaya-data.json');
  try {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const testFile = path.join(dir, `.test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return localPath;
  } catch {
    // Read-only filesystem on Vercel Serverless (/var/task)
    const tmpDir = path.join(os.tmpdir(), 'navodaya_data');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpDbPath = path.join(tmpDir, 'navodaya-data.json');
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(localPath)) {
      try {
        fs.copyFileSync(localPath, tmpDbPath);
      } catch {}
    }
    return tmpDbPath;
  }
}

function getInitialData(): DatabaseSchema {
  const adminId = 'admin-00000000-0000-0000-0000-000000000001';
  const studentId = 'student-00000000-0000-0000-0000-000000000002';
  const matId = '11111111-1111-1111-1111-111111111111';
  const mathId = '22222222-2222-2222-2222-222222222222';
  const langId = '33333333-3333-3333-3333-333333333333';

  const defaultProfiles: Profile[] = [
    {
      id: adminId,
      email: 'admin@navodaya.local',
      full_name: 'Mentor / Admin',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
    {
      id: studentId,
      email: 'sister@navodaya.local',
      full_name: 'Ananya Sharma',
      role: 'student',
      target_exam_year: 2026,
      created_at: new Date().toISOString(),
    },
  ];

  const defaultSubjects: Subject[] = [
    {
      id: matId,
      name: 'Mental Ability Test',
      code: 'MAT',
      description: 'Section 1: Non-verbal reasoning, pattern matching, and spatial orientation',
      display_order: 1,
    },
    {
      id: mathId,
      name: 'Arithmetic Test',
      code: 'MATH',
      description: 'Section 2: Fundamental operations, fractions, LCM/HCF, speed, and area',
      display_order: 2,
    },
    {
      id: langId,
      name: 'Language Test',
      code: 'LANG',
      description: 'Section 3: Comprehension passages, vocabulary, and contextual grammar',
      display_order: 3,
    },
  ];

  const defaultTopics: Topic[] = [
    { id: 'top-1', subject_id: matId, name: 'Odd Man Out', description: 'Finding the different figure' },
    { id: 'top-2', subject_id: matId, name: 'Pattern Completion', description: 'Completing the missing square' },
    { id: 'top-3', subject_id: matId, name: 'Figure Series Completion', description: 'Finding next in series' },
    { id: 'top-4', subject_id: matId, name: 'Analogy', description: 'Relational logic' },
    { id: 'top-5', subject_id: mathId, name: 'Number & Numeric System', description: 'Place values and primes' },
    { id: 'top-6', subject_id: mathId, name: 'LCM and HCF', description: 'Factors and multiples' },
    { id: 'top-7', subject_id: mathId, name: 'Fractions & Decimals', description: 'Fractional math' },
    { id: 'top-8', subject_id: mathId, name: 'Distance, Time and Speed', description: 'Travel and speed problems' },
    { id: 'top-9', subject_id: langId, name: 'Reading Comprehension', description: 'Passage questions' },
    { id: 'top-10', subject_id: langId, name: 'Vocabulary & Antonyms', description: 'Word meanings' },
  ];

  const starterPaperId = 'paper-day-01';
  const starterPaper: Paper = {
    id: starterPaperId,
    title: 'Navodaya Model Paper 01 (Daily Practice)',
    description: 'A curated 10-question daily challenge covering Mental Ability, Arithmetic, and Language to test readiness and build confidence.',
    duration_minutes: 30,
    total_marks: 12.5,
    negative_marking_per_question: 0.0,
    is_published: true,
    available_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    available_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: adminId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleQuestions: Question[] = [
    {
      id: 'q-mat-1',
      paper_id: starterPaperId,
      subject_id: matId,
      topic_id: 'top-1',
      question_number: 1,
      question_text: 'Four figures are given. Three are alike in some way and one is different. Choose the odd one out:',
      marks: 1.25,
      explanation: 'Options A, B, and C are closed geometrical polygons formed by straight lines (Triangle, Square, Pentagon), whereas Option D is a Circle formed by a continuous curved line with no vertices.',
      options: [
        { id: 'opt-q1-a', question_id: 'q-mat-1', option_label: 'A', option_text: 'Triangle (3 sides)', is_correct: false },
        { id: 'opt-q1-b', question_id: 'q-mat-1', option_label: 'B', option_text: 'Square (4 sides)', is_correct: false },
        { id: 'opt-q1-c', question_id: 'q-mat-1', option_label: 'C', option_text: 'Pentagon (5 sides)', is_correct: false },
        { id: 'opt-q1-d', question_id: 'q-mat-1', option_label: 'D', option_text: 'Circle (Curved boundary)', is_correct: true },
      ],
    },
    {
      id: 'q-mat-2',
      paper_id: starterPaperId,
      subject_id: matId,
      topic_id: 'top-4',
      question_number: 2,
      question_text: 'Analogy: If Circle is to Sphere, then Square is to:',
      marks: 1.25,
      explanation: 'A circle is a 2D geometric shape whose 3D counterpart is a sphere. Similarly, a square is a 2D shape whose 3D counterpart is a cube.',
      options: [
        { id: 'opt-q2-a', question_id: 'q-mat-2', option_label: 'A', option_text: 'Cube', is_correct: true },
        { id: 'opt-q2-b', question_id: 'q-mat-2', option_label: 'B', option_text: 'Rectangle', is_correct: false },
        { id: 'opt-q2-c', question_id: 'q-mat-2', option_label: 'C', option_text: 'Cone', is_correct: false },
        { id: 'opt-q2-d', question_id: 'q-mat-2', option_label: 'D', option_text: 'Cylinder', is_correct: false },
      ],
    },
    {
      id: 'q-mat-3',
      paper_id: starterPaperId,
      subject_id: matId,
      topic_id: 'top-2',
      question_number: 3,
      question_text: 'Pattern Completion: A clock hand points to 12, then to 3, then to 6. Where will it point next?',
      marks: 1.25,
      explanation: 'The hand rotates 90 degrees clockwise in each step: 12 -> 3 -> 6. Rotating another 90 degrees clockwise points directly to 9.',
      options: [
        { id: 'opt-q3-a', question_id: 'q-mat-3', option_label: 'A', option_text: '8', is_correct: false },
        { id: 'opt-q3-b', question_id: 'q-mat-3', option_label: 'B', option_text: '9', is_correct: true },
        { id: 'opt-q3-c', question_id: 'q-mat-3', option_label: 'C', option_text: '10', is_correct: false },
        { id: 'opt-q3-d', question_id: 'q-mat-3', option_label: 'D', option_text: '1', is_correct: false },
      ],
    },
    {
      id: 'q-math-1',
      paper_id: starterPaperId,
      subject_id: mathId,
      topic_id: 'top-5',
      question_number: 4,
      question_text: 'What is the difference between the place value and face value of 7 in the number 27,845?',
      marks: 1.25,
      explanation: 'In 27,845, the digit 7 is at the thousands place, so its place value = 7,000. Its face value is 7. Difference = 7,000 - 7 = 6,993.',
      options: [
        { id: 'opt-q4-a', question_id: 'q-math-1', option_label: 'A', option_text: '7,000', is_correct: false },
        { id: 'opt-q4-b', question_id: 'q-math-1', option_label: 'B', option_text: '6,993', is_correct: true },
        { id: 'opt-q4-c', question_id: 'q-math-1', option_label: 'C', option_text: '6,990', is_correct: false },
        { id: 'opt-q4-d', question_id: 'q-math-1', option_label: 'D', option_text: '0', is_correct: false },
      ],
    },
    {
      id: 'q-math-2',
      paper_id: starterPaperId,
      subject_id: mathId,
      topic_id: 'top-6',
      question_number: 5,
      question_text: 'The HCF of two numbers is 16 and their product is 3072. What is their LCM?',
      marks: 1.25,
      explanation: 'We know that Product of two numbers = HCF × LCM. Therefore, LCM = Product / HCF = 3072 / 16 = 192.',
      options: [
        { id: 'opt-q5-a', question_id: 'q-math-2', option_label: 'A', option_text: '182', is_correct: false },
        { id: 'opt-q5-b', question_id: 'q-math-2', option_label: 'B', option_text: '192', is_correct: true },
        { id: 'opt-q5-c', question_id: 'q-math-2', option_label: 'C', option_text: '202', is_correct: false },
        { id: 'opt-q5-d', question_id: 'q-math-2', option_label: 'D', option_text: '212', is_correct: false },
      ],
    },
    {
      id: 'q-math-3',
      paper_id: starterPaperId,
      subject_id: mathId,
      topic_id: 'top-7',
      question_number: 6,
      question_text: 'Simplify: 3/4 + 1/2 - 1/8 = ?',
      marks: 1.25,
      explanation: 'Find common denominator 8: 3/4 = 6/8, 1/2 = 4/8. So (6/8 + 4/8) - 1/8 = 10/8 - 1/8 = 9/8 = 1 1/8.',
      options: [
        { id: 'opt-q6-a', question_id: 'q-math-3', option_label: 'A', option_text: '7/8', is_correct: false },
        { id: 'opt-q6-b', question_id: 'q-math-3', option_label: 'B', option_text: '9/8', is_correct: true },
        { id: 'opt-q6-c', question_id: 'q-math-3', option_label: 'C', option_text: '5/8', is_correct: false },
        { id: 'opt-q6-d', question_id: 'q-math-3', option_label: 'D', option_text: '11/8', is_correct: false },
      ],
    },
    {
      id: 'q-math-4',
      paper_id: starterPaperId,
      subject_id: mathId,
      topic_id: 'top-8',
      question_number: 7,
      question_text: 'A bus leaves Delhi at 9:15 AM and reaches Chandigarh at 3:45 PM on the same day. What was the total travel duration?',
      marks: 1.25,
      explanation: 'From 9:15 AM to 12:00 Noon is 2 hours 45 minutes. From 12:00 Noon to 3:45 PM is 3 hours 45 minutes. Total = 2h 45m + 3h 45m = 5h 90m = 6 hours 30 minutes.',
      options: [
        { id: 'opt-q7-a', question_id: 'q-math-4', option_label: 'A', option_text: '6 hours 15 minutes', is_correct: false },
        { id: 'opt-q7-b', question_id: 'q-math-4', option_label: 'B', option_text: '6 hours 30 minutes', is_correct: true },
        { id: 'opt-q7-c', question_id: 'q-math-4', option_label: 'C', option_text: '7 hours 00 minutes', is_correct: false },
        { id: 'opt-q7-d', question_id: 'q-math-4', option_label: 'D', option_text: '5 hours 45 minutes', is_correct: false },
      ],
    },
    {
      id: 'q-lang-1',
      paper_id: starterPaperId,
      subject_id: langId,
      topic_id: 'top-9',
      question_number: 8,
      question_text: 'Read: "A tiny bird built her nest on the topmost branch of an oak tree to keep her eggs safe from prowling foxes." Why did the bird build the nest on the topmost branch?',
      marks: 1.25,
      explanation: 'The passage explicitly states she chose the topmost branch "to keep her eggs safe from prowling foxes".',
      options: [
        { id: 'opt-q8-a', question_id: 'q-lang-1', option_label: 'A', option_text: 'To get more morning sunlight', is_correct: false },
        { id: 'opt-q8-b', question_id: 'q-lang-1', option_label: 'B', option_text: 'To protect eggs from foxes', is_correct: true },
        { id: 'opt-q8-c', question_id: 'q-lang-1', option_label: 'C', option_text: 'To sing loudly for others', is_correct: false },
        { id: 'opt-q8-d', question_id: 'q-lang-1', option_label: 'D', option_text: 'Because leaves were thicker', is_correct: false },
      ],
    },
    {
      id: 'q-lang-2',
      paper_id: starterPaperId,
      subject_id: langId,
      topic_id: 'top-10',
      question_number: 9,
      question_text: 'Select the correct opposite (antonym) of the word "Courageous":',
      marks: 1.25,
      explanation: '"Courageous" means brave and fearless. Its exact opposite is "Cowardly" or timid.',
      options: [
        { id: 'opt-q9-a', question_id: 'q-lang-2', option_label: 'A', option_text: 'Brave', is_correct: false },
        { id: 'opt-q9-b', question_id: 'q-lang-2', option_label: 'B', option_text: 'Cowardly', is_correct: true },
        { id: 'opt-q9-c', question_id: 'q-lang-2', option_label: 'C', option_text: 'Honest', is_correct: false },
        { id: 'opt-q9-d', question_id: 'q-lang-2', option_label: 'D', option_text: 'Strong', is_correct: false },
      ],
    },
    {
      id: 'q-lang-3',
      paper_id: starterPaperId,
      subject_id: langId,
      topic_id: 'top-10',
      question_number: 10,
      question_text: 'Choose the word that correctly fills the blank: "Rohan has been waiting for the school bus _____ 7:00 AM."',
      marks: 1.25,
      explanation: 'We use "since" to denote a specific starting point in time (7:00 AM) with the present perfect continuous tense.',
      options: [
        { id: 'opt-q10-a', question_id: 'q-lang-3', option_label: 'A', option_text: 'for', is_correct: false },
        { id: 'opt-q10-b', question_id: 'q-lang-3', option_label: 'B', option_text: 'since', is_correct: true },
        { id: 'opt-q10-c', question_id: 'q-lang-3', option_label: 'C', option_text: 'from', is_correct: false },
        { id: 'opt-q10-d', question_id: 'q-lang-3', option_label: 'D', option_text: 'until', is_correct: false },
      ],
    },
  ];

  let allQuestions = sampleQuestions;
  const fixturePath = path.resolve(process.cwd(), 'public', 'samples', 'pre_extracted_navodaya_80q.json');
  if (fs.existsSync(fixturePath)) {
    try {
      const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
      if (fixtureData.questions && fixtureData.questions.length > 0) {
        allQuestions = fixtureData.questions.map((q: any) => {
          const sId = q.subject_code === 'MAT' ? matId : q.subject_code === 'MATH' ? mathId : langId;
          const qId = `q-navodaya-${q.question_number}`;
          return {
            id: qId,
            paper_id: starterPaperId,
            subject_id: sId,
            question_number: q.question_number,
            question_text: q.question_text,
            question_image_url: q.question_image_url,
            marks: q.marks || 1.25,
            instructions: q.instructions || null,
            explanation: q.explanation || null,
            options: q.options.map((opt: any) => ({
              id: `opt-${q.question_number}-${opt.option_label.toLowerCase()}`,
              question_id: qId,
              option_label: opt.option_label,
              option_text: opt.option_text,
              is_correct: !!opt.is_correct,
            })),
          };
        });
        starterPaper.title = 'मराठी नवोदय सराव परीक्षा २०२६ (संपूर्ण ८० प्रश्न - Mental Ability, Arithmetic, Language)';
      }
    } catch {}
  }

  const defaultOptions: QuestionOption[] = allQuestions.flatMap((q) => q.options);

  return {
    profiles: defaultProfiles,
    subjects: defaultSubjects,
    topics: defaultTopics,
    papers: [starterPaper],
    questions: allQuestions,
    options: defaultOptions,
    attempts: [],
    answers: [],
    sessions: [],
    revisionItems: [],
  };
}

export class LocalPersistentRepository implements IDataRepository {
  private ensureFile(): DatabaseSchema {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    }

    if (!fs.existsSync(dbPath)) {
      const initial = getInitialData();
      try { fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf-8'); } catch {}
      return initial;
    }

    try {
      const content = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      const initial = getInitialData();
      try { fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf-8'); } catch {}
      return initial;
    }
  }

  private saveFile(data: DatabaseSchema): void {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    }
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save database file:', e);
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const data = this.ensureFile();
    return data.profiles.find((p) => p.id === userId) || null;
  }

  async getProfiles(): Promise<Profile[]> {
    const data = this.ensureFile();
    return data.profiles;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const data = this.ensureFile();
    const idx = data.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      data.profiles[idx] = { ...data.profiles[idx], ...profile, updated_at: new Date().toISOString() };
    } else {
      data.profiles.push(profile);
    }
    this.saveFile(data);
    return profile;
  }

  async getSubjects(): Promise<Subject[]> {
    const data = this.ensureFile();
    return data.subjects.sort((a, b) => a.display_order - b.display_order);
  }

  async getTopics(subjectId?: string): Promise<Topic[]> {
    const data = this.ensureFile();
    let topics = data.topics;
    if (subjectId) {
      topics = topics.filter((t) => t.subject_id === subjectId);
    }
    return topics.map((t) => ({
      ...t,
      subject: data.subjects.find((s) => s.id === t.subject_id),
    }));
  }

  async getPapers(filter?: { publishedOnly?: boolean; studentId?: string }): Promise<Paper[]> {
    const data = this.ensureFile();
    let papers = data.papers;

    if (filter?.publishedOnly) {
      papers = papers.filter((p) => p.is_published);
    }

    return papers.map((p) => {
      const qCount = data.questions.filter((q) => q.paper_id === p.id).length;
      const aCount = data.attempts.filter((a) => a.paper_id === p.id).length;
      return {
        ...p,
        question_count: qCount,
        attempts_count: aCount,
      };
    });
  }

  async getPaperById(
    paperId: string,
    options?: { hideCorrectAnswers?: boolean }
  ): Promise<Paper | null> {
    const data = this.ensureFile();
    const paper = data.papers.find((p) => p.id === paperId);
    if (!paper) return null;

    const paperQuestions = data.questions
      .filter((q) => q.paper_id === paperId)
      .sort((a, b) => a.question_number - b.question_number)
      .map((q) => {
        const qOptions = data.options
          .filter((opt) => opt.question_id === q.id)
          .sort((a, b) => a.option_label.localeCompare(b.option_label))
          .map((opt) => {
            if (options?.hideCorrectAnswers) {
              const { is_correct, ...safeOption } = opt;
              return safeOption;
            }
            return opt;
          });

        return {
          ...q,
          options: qOptions,
          subject: data.subjects.find((s) => s.id === q.subject_id),
          topic: data.topics.find((t) => t.id === q.topic_id),
        };
      });

    return {
      ...paper,
      questions: paperQuestions,
      question_count: paperQuestions.length,
    };
  }

  async createPaper(paperInput: CreatePaperInput): Promise<Paper> {
    const data = this.ensureFile();
    const newPaper: Paper = {
      id: `paper-${Date.now()}`,
      title: paperInput.title,
      description: paperInput.description || '',
      pdf_path: paperInput.pdf_path,
      duration_minutes: Number(paperInput.duration_minutes) || 120,
      total_marks: Number(paperInput.total_marks) || 100,
      negative_marking_per_question: Number(paperInput.negative_marking_per_question) || 0,
      is_published: !!paperInput.is_published,
      available_from: paperInput.available_from || null,
      available_until: paperInput.available_until || null,
      created_by: paperInput.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      question_count: 0,
      attempts_count: 0,
    };

    data.papers.unshift(newPaper);
    this.saveFile(data);
    return newPaper;
  }

  async updatePaper(paperId: string, updates: Partial<Paper>): Promise<Paper | null> {
    const data = this.ensureFile();
    const idx = data.papers.findIndex((p) => p.id === paperId);
    if (idx < 0) return null;

    data.papers[idx] = {
      ...data.papers[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveFile(data);
    return data.papers[idx];
  }

  async deletePaper(paperId: string): Promise<boolean> {
    const data = this.ensureFile();
    data.papers = data.papers.filter((p) => p.id !== paperId);
    const deletedQuestions = data.questions.filter((q) => q.paper_id === paperId).map((q) => q.id);
    data.questions = data.questions.filter((q) => q.paper_id !== paperId);
    data.options = data.options.filter((opt) => !deletedQuestions.includes(opt.question_id));
    this.saveFile(data);
    return true;
  }

  async duplicatePaper(paperId: string, newTitle?: string): Promise<Paper | null> {
    const original = await this.getPaperById(paperId);
    if (!original) return null;

    const data = this.ensureFile();
    const newPaperId = `paper-${Date.now()}`;
    const duplicatedPaper: Paper = {
      ...original,
      id: newPaperId,
      title: newTitle || `${original.title} (Copy)`,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attempts_count: 0,
    };

    data.papers.unshift(duplicatedPaper);

    if (original.questions) {
      for (const q of original.questions) {
        const newQuestionId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newQuestion: Question = {
          ...q,
          id: newQuestionId,
          paper_id: newPaperId,
          options: [],
        };
        data.questions.push(newQuestion);

        for (const opt of q.options) {
          const newOptId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          data.options.push({
            ...opt,
            id: newOptId,
            question_id: newQuestionId,
          });
        }
      }
    }

    this.saveFile(data);
    return duplicatedPaper;
  }

  async addQuestion(questionInput: CreateQuestionInput): Promise<Question> {
    const data = this.ensureFile();
    const questionId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newOptions: QuestionOption[] = questionInput.options.map((opt) => ({
      id: `opt-${Date.now()}-${opt.option_label}-${Math.random().toString(36).substring(2, 5)}`,
      question_id: questionId,
      option_label: opt.option_label,
      option_text: opt.option_text,
      option_image_url: opt.option_image_url,
      is_correct: opt.is_correct,
    }));

    const newQuestion: Question = {
      id: questionId,
      paper_id: questionInput.paper_id,
      subject_id: questionInput.subject_id,
      topic_id: questionInput.topic_id,
      question_number: questionInput.question_number,
      question_text: questionInput.question_text,
      question_image_url: questionInput.question_image_url,
      marks: Number(questionInput.marks) || 1.25,
      explanation: questionInput.explanation || '',
      options: newOptions,
      created_at: new Date().toISOString(),
    };

    data.questions.push(newQuestion);
    data.options.push(...newOptions);

    // Update total marks of the paper
    const paper = data.papers.find((p) => p.id === questionInput.paper_id);
    if (paper) {
      const paperQuestions = data.questions.filter((q) => q.paper_id === paper.id);
      paper.total_marks = paperQuestions.reduce((sum, q) => sum + Number(q.marks || 1.25), 0);
    }

    this.saveFile(data);
    return newQuestion;
  }

  async updateQuestion(questionId: string, updates: Partial<CreateQuestionInput>): Promise<Question | null> {
    const data = this.ensureFile();
    const qIdx = data.questions.findIndex((q) => q.id === questionId);
    if (qIdx < 0) return null;

    const current = data.questions[qIdx];
    data.questions[qIdx] = {
      ...current,
      subject_id: updates.subject_id !== undefined ? updates.subject_id : current.subject_id,
      topic_id: updates.topic_id !== undefined ? updates.topic_id : current.topic_id,
      question_number: updates.question_number !== undefined ? updates.question_number : current.question_number,
      question_text: updates.question_text !== undefined ? updates.question_text : current.question_text,
      question_image_url: updates.question_image_url !== undefined ? updates.question_image_url : current.question_image_url,
      marks: updates.marks !== undefined ? Number(updates.marks) : current.marks,
      explanation: updates.explanation !== undefined ? updates.explanation : current.explanation,
    };

    if (updates.options) {
      data.options = data.options.filter((opt) => opt.question_id !== questionId);
      const newOptions = updates.options.map((opt) => ({
        id: `opt-${Date.now()}-${opt.option_label}`,
        question_id: questionId,
        option_label: opt.option_label,
        option_text: opt.option_text,
        option_image_url: opt.option_image_url,
        is_correct: opt.is_correct,
      }));
      data.options.push(...newOptions);
      data.questions[qIdx].options = newOptions;
    }

    this.saveFile(data);
    return data.questions[qIdx];
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    const data = this.ensureFile();
    data.questions = data.questions.filter((q) => q.id !== questionId);
    data.options = data.options.filter((opt) => opt.question_id !== questionId);
    this.saveFile(data);
    return true;
  }

  async createAttempt(paperId: string, studentId: string): Promise<ExamAttempt> {
    const data = this.ensureFile();
    const paper = data.papers.find((p) => p.id === paperId);
    if (!paper) throw new Error('Paper not found');

    // Check if there is an in-progress attempt already for this student and paper
    const existing = data.attempts.find(
      (a) => a.paper_id === paperId && a.student_id === studentId && a.status === 'in_progress'
    );
    if (existing) {
      return this.enrichAttempt(existing, data);
    }

    const newAttempt: ExamAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      paper_id: paperId,
      student_id: studentId,
      started_at: new Date().toISOString(),
      submitted_at: null,
      time_spent_seconds: 0,
      status: 'in_progress',
      total_score: 0,
      max_marks: paper.total_marks,
      percentage: 0,
      total_questions: data.questions.filter((q) => q.paper_id === paperId).length,
      correct_count: 0,
      wrong_count: 0,
      unanswered_count: 0,
      accuracy_percentage: 0,
      paper_snapshot: null,
      created_at: new Date().toISOString(),
    };

    data.attempts.push(newAttempt);
    this.saveFile(data);
    return this.enrichAttempt(newAttempt, data);
  }

  private enrichAttempt(attempt: ExamAttempt, data: DatabaseSchema): ExamAttempt {
    const paper = data.papers.find((p) => p.id === attempt.paper_id);
    const answers = data.answers.filter((ans) => ans.attempt_id === attempt.id);
    const answersMap: Record<string, AttemptAnswer> = {};
    answers.forEach((ans) => {
      answersMap[ans.question_id] = ans;
    });

    return {
      ...attempt,
      paper,
      answers: answersMap,
    };
  }

  async getAttempt(attemptId: string): Promise<ExamAttempt | null> {
    const data = this.ensureFile();
    const attempt = data.attempts.find((a) => a.id === attemptId);
    if (!attempt) return null;
    return this.enrichAttempt(attempt, data);
  }

  async getStudentAttempts(studentId: string): Promise<ExamAttempt[]> {
    const data = this.ensureFile();
    return data.attempts
      .filter((a) => a.student_id === studentId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .map((a) => this.enrichAttempt(a, data));
  }

  async saveAttemptAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
    selectedOptionLabel: string | null,
    isMarkedForReview: boolean,
    timeSpentSeconds: number = 0
  ): Promise<AttemptAnswer> {
    const data = this.ensureFile();
    const attempt = data.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status !== 'in_progress') throw new Error('Exam already submitted');

    let ans = data.answers.find((a) => a.attempt_id === attemptId && a.question_id === questionId);
    if (ans) {
      ans.selected_option_id = selectedOptionId;
      ans.selected_option_label = selectedOptionLabel;
      ans.is_marked_for_review = isMarkedForReview;
      ans.time_spent_seconds = timeSpentSeconds;
      ans.saved_at = new Date().toISOString();
    } else {
      ans = {
        id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        selected_option_label: selectedOptionLabel,
        is_marked_for_review: isMarkedForReview,
        is_correct: null,
        marks_obtained: 0,
        time_spent_seconds: timeSpentSeconds,
        saved_at: new Date().toISOString(),
      };
      data.answers.push(ans);
    }

    this.saveFile(data);
    return ans;
  }

  async submitAttempt(attemptId: string): Promise<ExamAttempt> {
    const data = this.ensureFile();
    const attempt = data.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    if (attempt.status === 'submitted') {
      return this.enrichAttempt(attempt, data);
    }

    const paper = data.papers.find((p) => p.id === attempt.paper_id);
    if (!paper) throw new Error('Paper not found');

    const questions = data.questions
      .filter((q) => q.paper_id === paper.id)
      .map((q) => ({
        ...q,
        options: data.options.filter((opt) => opt.question_id === q.id),
        subject: data.subjects.find((s) => s.id === q.subject_id),
        topic: data.topics.find((t) => t.id === q.topic_id),
      }));

    const existingAnswers = data.answers.filter((a) => a.attempt_id === attemptId);
    const answersMap: Record<string, AttemptAnswer> = {};
    existingAnswers.forEach((a) => {
      answersMap[a.question_id] = a;
    });

    // Authoritative Server Evaluation
    const evaluation = evaluateAttempt(paper, questions, answersMap);

    // Calculate actual elapsed time
    const started = new Date(attempt.started_at).getTime();
    const submitted = Date.now();
    const elapsedSeconds = Math.max(1, Math.round((submitted - started) / 1000));

    attempt.submitted_at = new Date(submitted).toISOString();
    attempt.time_spent_seconds = elapsedSeconds;
    attempt.status = 'submitted';
    attempt.total_score = evaluation.total_score;
    attempt.max_marks = evaluation.max_marks;
    attempt.percentage = evaluation.percentage;
    attempt.total_questions = evaluation.total_questions;
    attempt.correct_count = evaluation.correct_count;
    attempt.wrong_count = evaluation.wrong_count;
    attempt.unanswered_count = evaluation.unanswered_count;
    attempt.accuracy_percentage = evaluation.accuracy_percentage;
    attempt.paper_snapshot = evaluation.paper_snapshot;

    // Persist evaluated answers
    data.answers = data.answers.filter((a) => a.attempt_id !== attemptId);
    Object.values(evaluation.evaluated_answers).forEach((ea) => {
      data.answers.push({
        ...ea,
        attempt_id: attemptId,
      });
    });

    // Track Revision Items for missed questions
    evaluation.missed_question_ids.forEach((qid) => {
      const rev = data.revisionItems.find(
        (r) => r.student_id === attempt.student_id && r.question_id === qid
      );
      if (rev) {
        rev.missed_count += 1;
        rev.mastered = false;
        rev.last_attempt_id = attemptId;
      } else {
        data.revisionItems.push({
          id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          student_id: attempt.student_id,
          question_id: qid,
          last_attempt_id: attemptId,
          missed_count: 1,
          mastered: false,
          created_at: new Date().toISOString(),
        });
      }
    });

    // Automatically record exam study session
    await this.recordStudySession(
      attempt.student_id,
      'exam',
      elapsedSeconds,
      attempt.id
    );

    this.saveFile(data);
    return this.enrichAttempt(attempt, data);
  }

  async recordStudySession(
    studentId: string,
    sessionType: 'exam' | 'solution_review' | 'revision' | 'practice',
    activeDurationSeconds: number,
    referenceId?: string | null
  ): Promise<StudySession> {
    const data = this.ensureFile();
    const newSession: StudySession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      student_id: studentId,
      session_type: sessionType,
      reference_id: referenceId || null,
      started_at: new Date(Date.now() - activeDurationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      active_duration_seconds: activeDurationSeconds,
      last_heartbeat_at: new Date().toISOString(),
    };

    data.sessions.push(newSession);
    this.saveFile(data);
    return newSession;
  }

  async getStudentStudyTimeToday(studentId: string): Promise<number> {
    const data = this.ensureFile();
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = data.sessions.filter(
      (s) => s.student_id === studentId && s.started_at.startsWith(today)
    );
    return todaySessions.reduce((acc, s) => acc + (s.active_duration_seconds || 0), 0);
  }

  async getRevisionItems(studentId: string): Promise<RevisionItem[]> {
    const data = this.ensureFile();
    const items = data.revisionItems.filter((r) => r.student_id === studentId && !r.mastered);
    return items.map((r) => {
      const q = data.questions.find((q) => q.id === r.question_id);
      return {
        ...r,
        question: q
          ? {
              ...q,
              options: data.options.filter((opt) => opt.question_id === q.id),
              subject: data.subjects.find((s) => s.id === q.subject_id),
              topic: data.topics.find((t) => t.id === q.topic_id),
            }
          : undefined,
      };
    });
  }

  async markRevisionItemMastered(itemId: string, mastered: boolean): Promise<boolean> {
    const data = this.ensureFile();
    const item = data.revisionItems.find((r) => r.id === itemId);
    if (!item) return false;
    item.mastered = mastered;
    item.last_reviewed_at = new Date().toISOString();
    this.saveFile(data);
    return true;
  }

  async getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
    const data = this.ensureFile();
    const attempts = data.attempts
      .filter((a) => a.student_id === studentId && a.status === 'submitted')
      .sort((a, b) => new Date(b.submitted_at || b.started_at).getTime() - new Date(a.submitted_at || a.started_at).getTime());

    const todayStr = new Date().toISOString().slice(0, 10);
    const publishedPapers = data.papers.filter((p) => p.is_published);
    const todayAttempts = attempts.filter((a) => (a.submitted_at || a.started_at).startsWith(todayStr));

    const totalPapersAttempted = attempts.length;
    const scores = attempts.map((a) => Number(a.total_score || 0));
    const latestScore = attempts.length > 0 ? scores[0] : null;
    const bestScore = attempts.length > 0 ? Math.max(...scores) : null;
    const averageScore =
      attempts.length > 0
        ? Number((scores.reduce((s, v) => s + v, 0) / attempts.length).toFixed(1))
        : null;

    const totalQuestionsSolved = attempts.reduce((sum, a) => sum + (a.correct_count + a.wrong_count), 0);
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correct_count, 0);
    const overallAccuracy =
      totalQuestionsSolved > 0
        ? Number(((totalCorrect / totalQuestionsSolved) * 100).toFixed(1))
        : 0;

    const studyTimeToday = await this.getStudentStudyTimeToday(studentId);

    // Subject breakdown across submitted attempts
    const subjectProgress: SubjectAnalytics[] = data.subjects.map((sub) => {
      let subTotalQ = 0;
      let subAttempted = 0;
      let subCorrect = 0;
      let subWrong = 0;
      let subMarksPossible = 0;
      let subMarksObtained = 0;
      let subTimeSpent = 0;

      attempts.forEach((att) => {
        if (att.paper_snapshot) {
          att.paper_snapshot.questions.forEach((q) => {
            if (q.subject_id === sub.id) {
              subTotalQ++;
              subMarksPossible += q.marks;
              const ans = data.answers.find((a) => a.attempt_id === att.id && a.question_id === q.id);
              if (ans?.selected_option_id) {
                subAttempted++;
                subTimeSpent += ans.time_spent_seconds || 0;
                if (ans.is_correct) {
                  subCorrect++;
                  subMarksObtained += q.marks;
                } else {
                  subWrong++;
                  if (att.paper_snapshot?.negative_marking_per_question) {
                    subMarksObtained -= att.paper_snapshot.negative_marking_per_question;
                  }
                }
              }
            }
          });
        }
      });

      const accuracy = subAttempted > 0 ? Number(((subCorrect / subAttempted) * 100).toFixed(1)) : 0;
      const avgTime = subAttempted > 0 ? Math.round(subTimeSpent / subAttempted) : 0;

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        subject_code: sub.code,
        total_questions: subTotalQ,
        attempted_count: subAttempted,
        correct_count: subCorrect,
        wrong_count: subWrong,
        unanswered_count: subTotalQ - subAttempted,
        total_marks_possible: Number(subMarksPossible.toFixed(2)),
        marks_obtained: Math.max(0, Number(subMarksObtained.toFixed(2))),
        accuracy_percentage: accuracy,
        average_time_per_question_seconds: avgTime,
      };
    });

    // Weak topics
    const weakTopicsMap: Record<string, { topic_name: string; subject_name: string; missed: number }> = {};
    const unmasteredRevs = data.revisionItems.filter((r) => r.student_id === studentId && !r.mastered);
    unmasteredRevs.forEach((rev) => {
      const q = data.questions.find((q) => q.id === rev.question_id);
      if (q && q.topic_id) {
        const t = data.topics.find((top) => top.id === q.topic_id);
        const s = data.subjects.find((sub) => sub.id === q.subject_id);
        if (t) {
          if (!weakTopicsMap[t.id]) {
            weakTopicsMap[t.id] = {
              topic_name: t.name,
              subject_name: s?.name || 'General',
              missed: 0,
            };
          }
          weakTopicsMap[t.id].missed += rev.missed_count;
        }
      }
    });

    const weakTopics = Object.entries(weakTopicsMap)
      .map(([topic_id, info]) => ({
        topic_id,
        topic_name: info.topic_name,
        subject_name: info.subject_name,
        missed_count: info.missed,
      }))
      .sort((a, b) => b.missed_count - a.missed_count)
      .slice(0, 5);

    // Weekly performance
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weeklyPerformance = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dateKey = d.toISOString().slice(0, 10);
      const dayAttempts = attempts.filter((a) => (a.submitted_at || a.started_at).startsWith(dateKey));
      const dayScores = dayAttempts.map((a) => Number(a.percentage || 0));
      const avgDayScore =
        dayScores.length > 0 ? Number((dayScores.reduce((s, v) => s + v, 0) / dayScores.length).toFixed(1)) : 0;
      const dayAccuracy =
        dayAttempts.length > 0
          ? Number((dayAttempts.reduce((s, a) => s + (a.accuracy_percentage || 0), 0) / dayAttempts.length).toFixed(1))
          : 0;

      return {
        day: days[d.getDay()],
        date: dateKey,
        score: avgDayScore,
        accuracy: dayAccuracy,
        papers_taken: dayAttempts.length,
      };
    });

    // Calculate streak
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const hasAttempt = attempts.some((a) => (a.submitted_at || a.started_at).startsWith(dateStr));
      if (hasAttempt) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If checking today and no attempt today, check if yesterday had attempt
        if (streak === 0 && dateStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().slice(0, 10);
          const hasYesterday = attempts.some((a) => (a.submitted_at || a.started_at).startsWith(yesterdayStr));
          if (hasYesterday) {
            streak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return {
      today_available_papers_count: publishedPapers.length,
      today_completed_papers_count: todayAttempts.length,
      current_streak_days: streak,
      total_papers_attempted: totalPapersAttempted,
      latest_score: latestScore,
      best_score: bestScore,
      average_score: averageScore,
      total_questions_solved: totalQuestionsSolved,
      overall_accuracy_percentage: overallAccuracy,
      study_time_today_seconds: studyTimeToday,
      subject_progress: subjectProgress,
      recent_attempts: attempts.slice(0, 5),
      weak_topics: weakTopics,
      weekly_performance: weeklyPerformance,
    };
  }
}
