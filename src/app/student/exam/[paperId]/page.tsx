'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  GraduationCap,
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Paper, Question, AttemptAnswer, ExamAttempt } from '@/types/database';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { QuestionPalette } from '@/components/exam/QuestionPalette';
import { SubmitModal } from '@/components/exam/SubmitModal';
import { StudyTracker } from '@/components/study/StudyTracker';

export default function ExamInterfacePage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<AttemptAnswer>>>({});

  // Autosave status: 'saved' | 'saving' | 'error'
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or resume attempt
  useEffect(() => {
    let isMounted = true;

    async function initExam() {
      try {
        const res = await fetch('/api/exam/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to start exam');

        if (isMounted) {
          setPaper(data.paper);
          setAttempt(data.attempt);
          setQuestions(data.paper.questions || []);

          // Prepopulate existing saved answers
          if (data.attempt.answers) {
            setAnswers(data.attempt.answers);
          }

          // If attempt was already submitted, redirect to results
          if (data.attempt.status === 'submitted') {
            router.push(`/student/results/${data.attempt.id}`);
          }
        }
      } catch (err) {
        // Handle error
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initExam();

    return () => {
      isMounted = false;
    };
  }, [paperId, router]);

  // Debounced Autosave function
  const saveAnswerToServer = useCallback(
    async (
      questionId: string,
      selectedOptionId: string | null,
      selectedOptionLabel: string | null,
      isMarkedForReview: boolean
    ) => {
      if (!attempt || attempt.status === 'submitted') return;

      setAutosaveStatus('saving');
      try {
        const res = await fetch('/api/exam/save-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId: attempt.id,
            questionId,
            selectedOptionId,
            selectedOptionLabel,
            isMarkedForReview,
          }),
        });

        if (!res.ok) throw new Error('Save failed');
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('error');
      }
    },
    [attempt]
  );

  // Handle Option Selection
  const handleSelectOption = (optionId: string, optionLabel: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers[currentQ.id] || {};
    const newAnswers = {
      ...answers,
      [currentQ.id]: {
        ...existingAns,
        selected_option_id: optionId,
        selected_option_label: optionLabel,
      },
    };
    setAnswers(newAnswers);

    // Trigger background autosave
    saveAnswerToServer(
      currentQ.id,
      optionId,
      optionLabel,
      !!existingAns.is_marked_for_review
    );
  };

  // Clear current answer
  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers[currentQ.id] || {};
    const newAnswers = {
      ...answers,
      [currentQ.id]: {
        ...existingAns,
        selected_option_id: null,
        selected_option_label: null,
      },
    };
    setAnswers(newAnswers);

    saveAnswerToServer(currentQ.id, null, null, !!existingAns.is_marked_for_review);
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers[currentQ.id] || {};
    const newReviewState = !existingAns.is_marked_for_review;

    const newAnswers = {
      ...answers,
      [currentQ.id]: {
        ...existingAns,
        is_marked_for_review: newReviewState,
      },
    };
    setAnswers(newAnswers);

    saveAnswerToServer(
      currentQ.id,
      existingAns.selected_option_id || null,
      existingAns.selected_option_label || null,
      newReviewState
    );
  };

  // Final Exam Submission
  const handleSubmitExam = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const data = await res.json();

      if (data.success && data.attempt) {
        router.push(`/student/exam/${paperId}/submitted?attemptId=${attempt.id}`);
      } else {
        router.push(`/student/results/${attempt.id}`);
      }
    } catch {
      router.push(`/student/results/${attempt.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !paper || !attempt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold text-slate-800">Setting up your examination session...</div>
        <p className="text-xs text-slate-500">Restoring in-progress answers and verifying timer</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  let answeredCount = 0;
  let reviewCount = 0;
  let unansweredCount = 0;
  questions.forEach((q) => {
    const ans = answers[q.id];
    if (ans?.is_marked_for_review) reviewCount++;
    else if (ans?.selected_option_id) answeredCount++;
    else unansweredCount++;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen">
      <StudyTracker sessionType="exam" referenceId={attempt.id} />

      {/* Top Authoritative Exam Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                {paper.title}
              </h1>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Total Marks: {paper.total_marks}</span>
                <span>•</span>
                <span>{questions.length} Questions</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Autosave Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              {autosaveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-slate-600">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  Saving...
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Saved
                </span>
              )}
              {autosaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-amber-700">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  Retrying save...
                </span>
              )}
            </div>

            {/* Authoritative Countdown Timer */}
            <ExamTimer
              startedAt={attempt.started_at}
              durationMinutes={paper.duration_minutes}
              onTimeExpired={handleSubmitExam}
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Card & Controls (3 cols on desktop) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          {currentQ ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                {/* Section & Marks Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
                      {currentQ.subject?.name || 'Navodaya Question'}
                    </span>
                    {currentQ.topic?.name && (
                      <span className="text-xs text-slate-500 font-medium">
                        ({currentQ.topic.name})
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    +{currentQ.marks} Marks
                  </div>
                </div>

                {/* Question Text & Diagram */}
                <div className="space-y-4 mb-8">
                  {(currentQ as any).instructions && (
                    <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 font-medium">
                      <span className="font-bold block mb-0.5">Directions / सूचना:</span>
                      {(currentQ as any).instructions}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <span className="h-7 w-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {currentQ.question_number}
                    </span>
                    <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
                      {currentQ.question_text}
                    </p>
                  </div>

                  {currentQ.question_image_url && (
                    <div className="max-w-3xl mx-auto my-4 rounded-2xl overflow-hidden border border-slate-200 bg-white p-2 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQ.question_image_url}
                        alt={`Figure for Question ${currentQ.question_number}`}
                        className="w-full object-contain max-h-72 sm:max-h-80"
                      />
                    </div>
                  )}
                </div>

                {/* Multiple Choice Options (A, B, C, D) */}
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const isSelected = currentAnswer?.selected_option_id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id, opt.option_label)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span
                          className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {opt.option_label}
                        </span>
                        <span className="text-sm font-medium text-slate-800 flex-1 leading-normal">
                          {opt.option_text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleReview}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentAnswer?.is_marked_for_review
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>
                      {currentAnswer?.is_marked_for_review ? 'Marked for Review' : 'Mark for Review'}
                    </span>
                  </button>

                  {currentAnswer?.selected_option_id && (
                    <button
                      type="button"
                      onClick={handleClearAnswer}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Clear Selection</span>
                    </button>
                  )}
                </div>

                {/* Navigation Buttons: Previous & Next */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Question Palette (1 col on desktop) */}
        <div className="lg:col-span-1 space-y-4">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
          />

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-xs space-y-2 text-slate-600">
            <div className="font-bold text-slate-800">Exam Instructions Tip:</div>
            <p>
              Non-verbal reasoning & arithmetic questions are best solved by eliminating incorrect options first.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitExam}
        isSubmitting={submitting}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        reviewCount={reviewCount}
        unansweredCount={unansweredCount}
      />
    </div>
  );
}
