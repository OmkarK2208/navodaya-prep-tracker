'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';
import { ExamAttempt, Paper, Question } from '@/types/database';
import { StudyTracker } from '@/components/study/StudyTracker';

export default function SolutionsReviewPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'unanswered' | 'correct'>('wrong');
  const [retrySelected, setRetrySelected] = useState<Record<string, string>>({});
  const [retryResult, setRetryResult] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/exam/attempts/${attemptId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.attempt) setAttempt(data.attempt);
        if (data.paper) setPaper(data.paper);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading solutions & explanations...</div>;
  }

  if (!attempt || !paper) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-900">Attempt Not Found</h2>
        <Link href="/student" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Use paper_snapshot questions if available (for immutable history!) or paper.questions
  const questionsList = attempt.paper_snapshot?.questions || paper.questions || [];

  const filteredQuestions = questionsList.filter((q) => {
    const ans = attempt.answers?.[q.id];
    if (filter === 'all') return true;
    if (filter === 'wrong') return ans?.selected_option_id && !ans?.is_correct;
    if (filter === 'unanswered') return !ans?.selected_option_id;
    if (filter === 'correct') return !!ans?.is_correct;
    return true;
  });

  const handleRetrySelect = (questionId: string, optionId: string, isCorrect: boolean) => {
    setRetrySelected((prev) => ({ ...prev, [questionId]: optionId }));
    setRetryResult((prev) => ({ ...prev, [questionId]: isCorrect }));
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <StudyTracker sessionType="solution_review" referenceId={attempt.id} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href={`/student/results/${attempt.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Score Summary
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Solutions & Answer Explanations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {paper.title} • Review every question and learn from mistakes
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setFilter('wrong')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'wrong' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Wrong ({attempt.wrong_count})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'unanswered' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unanswered ({attempt.unanswered_count})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Correct ({attempt.correct_count})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({questionsList.length})
          </button>
        </div>
      </div>

      {/* Questions Solution List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">No Questions in this Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'wrong' && 'Awesome job! You did not get any questions wrong in this category.'}
            {filter === 'unanswered' && 'You answered every question! No unanswered questions found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const studentAns = attempt.answers?.[q.id];
            const isCorrect = studentAns?.is_correct === true;
            const isUnanswered = !studentAns?.selected_option_id;

            const correctOption = q.options.find((opt) => opt.is_correct);
            const studentOption = q.options.find((opt) => opt.id === studentAns?.selected_option_id);

            const hasRetried = retrySelected[q.id] !== undefined;
            const isRetryCorrect = retryResult[q.id];

            return (
              <div
                key={q.id}
                className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-xs space-y-5 transition-all ${
                  isCorrect
                    ? 'border-emerald-200'
                    : isUnanswered
                    ? 'border-slate-300'
                    : 'border-rose-200'
                }`}
              >
                {/* Header: Status Pill & Subject */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      Question {q.question_number}
                    </span>
                    {/* Subject & Topic display */}
                    {(() => {
                      const subjectTitle = (q as any).subject_name || (q as any).subject?.name || 'Navodaya Syllabus';
                      const topicTitle = (q as any).topic_name || (q as any).topic?.name;
                      return (
                        <>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                            {subjectTitle}
                          </span>
                          {topicTitle && (
                            <span className="text-xs text-slate-500">({topicTitle})</span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+{q.marks})
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <HelpCircle className="h-3.5 w-3.5" /> Unanswered (0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="h-3.5 w-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-base font-semibold text-slate-800 leading-relaxed">
                  {q.question_text}
                </p>

                {/* Options List with Visual Clarification */}
                <div className="space-y-2.5">
                  {q.options.map((opt) => {
                    const isStudentChoice = opt.id === studentOption?.id;
                    const isRightAnswer = opt.is_correct;

                    let optStyle = 'border-slate-200 bg-white text-slate-700';
                    let badge = null;

                    if (isRightAnswer) {
                      optStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500';
                      badge = (
                        <span className="text-[11px] font-bold text-emerald-700 ml-auto bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ Correct Answer
                        </span>
                      );
                    } else if (isStudentChoice && !isCorrect) {
                      optStyle = 'border-rose-400 bg-rose-50/70 text-rose-950';
                      badge = (
                        <span className="text-[11px] font-bold text-rose-700 ml-auto bg-rose-100 px-2 py-0.5 rounded-md">
                          ✗ Your Selection
                        </span>
                      );
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${optStyle}`}
                      >
                        <span className="h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 bg-white border border-slate-200 shadow-2xs">
                          {opt.option_label}
                        </span>
                        <span className="text-sm">{opt.option_text}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-xs sm:text-sm text-indigo-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span>Step-by-Step Explanation:</span>
                    </div>
                    <p className="leading-relaxed text-indigo-900/90 pl-5">{q.explanation}</p>
                  </div>
                )}

                {/* Interactive Retry Mode for Sister */}
                {(!isCorrect || isUnanswered) && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Practice Retry: Try answering this question again</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleRetrySelect(q.id, opt.id, !!opt.is_correct)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            retrySelected[q.id] === opt.id
                              ? opt.is_correct
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Option {opt.option_label}
                        </button>
                      ))}
                    </div>

                    {hasRetried && (
                      <div className="mt-2 text-xs font-semibold">
                        {isRetryCorrect ? (
                          <span className="text-emerald-700">
                            🎉 Excellent! You got it right on your retry!
                          </span>
                        ) : (
                          <span className="text-rose-700">
                            Not quite. Read the explanation above and check why Option {correctOption?.option_label} is correct.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
