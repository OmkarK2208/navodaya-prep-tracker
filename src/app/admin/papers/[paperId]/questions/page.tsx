'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Eye,
  Save,
  HelpCircle,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Paper, Question, Subject, Topic } from '@/types/database';

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new/editing question
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState('');
  const [marks, setMarks] = useState('1.25');
  const [explanation, setExplanation] = useState('');

  // Options A, B, C, D
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // AI Extraction state
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [paperRes, subRes] = await Promise.all([
        fetch(`/api/papers/${paperId}`),
        fetch('/api/subjects'),
      ]);
      const paperData = await paperRes.json();
      const subData = await subRes.json();

      if (paperData.paper) setPaper(paperData.paper);
      if (subData.subjects) {
        setSubjects(subData.subjects);
        if (subData.subjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subData.subjects[0].id);
        }
      }
      if (subData.topics) setTopics(subData.topics);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paperId]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId('');
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      setError('All four options (A, B, C, D) must have text');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const optionsPayload = [
      { option_label: 'A' as const, option_text: optA, is_correct: correctOption === 'A' },
      { option_label: 'B' as const, option_text: optB, is_correct: correctOption === 'B' },
      { option_label: 'C' as const, option_text: optC, is_correct: correctOption === 'C' },
      { option_label: 'D' as const, option_text: optD, is_correct: correctOption === 'D' },
    ];

    try {
      if (editingQuestionId) {
        // Update question
        const res = await fetch(`/api/questions/${editingQuestionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject_id: selectedSubjectId,
            topic_id: selectedTopicId || undefined,
            question_text: questionText,
            question_image_url: questionImageUrl || undefined,
            marks: Number(marks),
            explanation,
            options: optionsPayload,
          }),
        });
        if (!res.ok) throw new Error('Failed to update question');
        setSuccessMsg('Question updated successfully!');
      } else {
        // Add new question
        const res = await fetch(`/api/papers/${paperId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject_id: selectedSubjectId,
            topic_id: selectedTopicId || undefined,
            question_text: questionText,
            question_image_url: questionImageUrl || undefined,
            marks: Number(marks),
            explanation,
            options: optionsPayload,
          }),
        });
        if (!res.ok) throw new Error('Failed to add question');
        setSuccessMsg('Question added successfully!');
      }

      // Reset form
      setQuestionText('');
      setQuestionImageUrl('');
      setExplanation('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectOption('A');
      setEditingQuestionId(null);

      // Reload questions
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error saving question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q.id);
    setSelectedSubjectId(q.subject_id || subjects[0]?.id || '');
    setSelectedTopicId(q.topic_id || '');
    setQuestionText(q.question_text);
    setQuestionImageUrl(q.question_image_url || '');
    setMarks(String(q.marks || 1.25));
    setExplanation(q.explanation || '');

    const a = q.options.find((o) => o.option_label === 'A')?.option_text || '';
    const b = q.options.find((o) => o.option_label === 'B')?.option_text || '';
    const c = q.options.find((o) => o.option_label === 'C')?.option_text || '';
    const d = q.options.find((o) => o.option_label === 'D')?.option_text || '';
    setOptA(a);
    setOptB(b);
    setOptC(c);
    setOptD(d);

    const correct = q.options.find((o) => o.is_correct)?.option_label || 'A';
    setCorrectOption(correct as any);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // ignore
    }
  };

  const handleTogglePublish = async () => {
    if (!paper) return;
    try {
      const res = await fetch(`/api/papers/${paper.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !paper.is_published }),
      });
      if (res.ok) {
        setPaper({ ...paper, is_published: !paper.is_published });
      }
    } catch {
      // ignore
    }
  };

  const handleAiExtract = async () => {
    setAiMessage('Checking AI extraction capabilities for attached PDF...');
    try {
      const res = await fetch('/api/admin/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, pdfPath: paper?.pdf_path }),
      });
      const data = await res.json();
      setAiMessage(data.message);
    } catch {
      setAiMessage('AI service could not be reached. Manual entry is fully active.');
    }
  };

  if (loading || !paper) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading question editor...</div>;
  }

  const filteredTopics = topics.filter((t) => t.subject_id === selectedSubjectId);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/admin/papers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Papers
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">{paper.title}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                paper.is_published
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {paper.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {paper.questions?.length || 0} Questions configured • {paper.total_marks} Marks Total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              paper.is_published
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{paper.is_published ? 'Unpublish (Set Draft)' : 'Publish Paper Now'}</span>
          </button>

          <Link
            href={`/student/exam/${paper.id}/instructions`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <Eye className="h-4 w-4 text-indigo-600" />
            <span>Preview Exam</span>
          </Link>
        </div>
      </div>

      {/* AI Extraction Banner (If PDF attached) */}
      {paper.pdf_path && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span>Attached PDF: <strong>{paper.pdf_path}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiExtract}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI PDF Assist</span>
            </button>
          </div>
        </div>
      )}

      {aiMessage && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>{aiMessage}</span>
        </div>
      )}

      {/* Grid: Question Form (Left) & Current Questions List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form to Add / Edit Question (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-600" />
              <span>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</span>
            </h2>
            {editingQuestionId && (
              <button
                type="button"
                onClick={() => {
                  setEditingQuestionId(null);
                  setQuestionText('');
                  setOptA('');
                  setOptB('');
                  setOptC('');
                  setOptD('');
                  setExplanation('');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Cancel Editing
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveQuestion} className="space-y-4">
            {/* Subject and Topic Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic (Syllabus)</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- General Topic --</option>
                  {filteredTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter the question problem statement or passage question..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Marks and Image URL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Figure Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={questionImageUrl}
                  onChange={(e) => setQuestionImageUrl(e.target.value)}
                  placeholder="https://... image of pattern or figure"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Multiple Choice Options & Answer Key */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Multiple Choice Options & Correct Answer Key <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Select the radio button for the correct option
                </span>
              </div>

              {/* Option A */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={correctOption === 'A'}
                    onChange={() => setCorrectOption('A')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Option A</span>
                </label>
                <input
                  type="text"
                  required
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  placeholder="Text for Option A"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Option B */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={correctOption === 'B'}
                    onChange={() => setCorrectOption('B')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Option B</span>
                </label>
                <input
                  type="text"
                  required
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  placeholder="Text for Option B"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Option C */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={correctOption === 'C'}
                    onChange={() => setCorrectOption('C')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Option C</span>
                </label>
                <input
                  type="text"
                  required
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  placeholder="Text for Option C"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Option D */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={correctOption === 'D'}
                    onChange={() => setCorrectOption('D')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Option D</span>
                </label>
                <input
                  type="text"
                  required
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  placeholder="Text for Option D"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Step-by-Step Explanation for Sister
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this answer is correct in simple, encouraging language..."
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Question */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{editingQuestionId ? 'Update Question' : 'Save Question to Paper'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Existing Questions in this Paper (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Questions in this Paper ({paper.questions?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Click edit to modify question text, options, or answer keys
            </p>

            {paper.questions && paper.questions.length > 0 ? (
              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {paper.questions.map((q) => {
                  const correctOpt = q.options.find((o) => o.is_correct);

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Q{q.question_number} • {q.subject?.name || 'Question'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(q)}
                            className="p-1 rounded-md text-slate-600 hover:bg-slate-200"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(q.id)}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-100"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-700 line-clamp-2">{q.question_text}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500">+{q.marks} marks</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Key: Option {correctOpt?.option_label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                No questions added yet. Use the form on the left to add your first question!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
