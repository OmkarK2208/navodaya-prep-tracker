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
  Maximize2,
  Minimize2,
  Type,
  Sparkles,
} from 'lucide-react';
import { Paper, Question, AttemptAnswer, ExamAttempt } from '@/types/database';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { QuestionPalette } from '@/components/exam/QuestionPalette';
import { SubmitModal } from '@/components/exam/SubmitModal';
import { StudyTracker } from '@/components/study/StudyTracker';
import { InteractiveQuestionImage } from '@/components/exam/InteractiveQuestionImage';

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

  // UI preferences: Fullscreen & Font Sizing
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

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

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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
  const handleSelectOption = useCallback(
    (optionId: string, optionLabel: string) => {
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

      saveAnswerToServer(
        currentQ.id,
        optionId,
        optionLabel,
        !!existingAns.is_marked_for_review
      );
    },
    [questions, currentIndex, answers, saveAnswerToServer]
  );

  // Clear current answer
  const handleClearAnswer = useCallback(() => {
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
  }, [questions, currentIndex, answers, saveAnswerToServer]);

  // Toggle Mark for Review
  const handleToggleReview = useCallback(() => {
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
  }, [questions, currentIndex, answers, saveAnswerToServer]);

  // Keyboard navigation & answer shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input or textarea is active or modal is open
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || showSubmitModal) return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleReview();
      } else {
        // Option selection: 1/A, 2/B, 3/C, 4/D
        const keyMap: Record<string, string> = {
          '1': 'A',
          'a': 'A',
          'A': 'A',
          '2': 'B',
          'b': 'B',
          'B': 'B',
          '3': 'C',
          'c': 'C',
          'C': 'C',
          '4': 'D',
          'd': 'D',
          'D': 'D',
        };
        const mappedLabel = keyMap[e.key];
        if (mappedLabel) {
          const opt = currentQ.options.find((o) => o.option_label === mappedLabel);
          if (opt) {
            e.preventDefault();
            handleSelectOption(opt.id, opt.option_label);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, currentIndex, showSubmitModal, handleToggleReview, handleSelectOption]);

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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[60vh]">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-100" />
        <div className="text-base font-extrabold text-slate-900">Setting up your examination session...</div>
        <p className="text-xs text-slate-500 max-w-sm">
          Loading Marathi & English question papers, high-resolution visual diagrams, and synchronizing clock.
        </p>
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

  const percentCompleted = Math.round((answeredCount / (questions.length || 1)) * 100);

  // Font size classes
  const questionTextClass =
    fontSize === 'xlarge'
      ? 'text-xl sm:text-2xl leading-relaxed'
      : fontSize === 'large'
      ? 'text-lg sm:text-xl leading-relaxed'
      : 'text-base sm:text-lg leading-relaxed';

  const optionTextClass =
    fontSize === 'xlarge' ? 'text-base sm:text-lg' : fontSize === 'large' ? 'text-sm sm:text-base' : 'text-sm';

  return (
    <div className="flex-1 flex flex-col bg-slate-100/70 min-h-screen">
      <StudyTracker sessionType="exam" referenceId={attempt.id} />

      {/* Top Exam Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-100">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1">
                {paper.title}
              </h1>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Total: {paper.total_marks} Marks</span>
                <span>•</span>
                <span>{questions.length} Questions</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline text-indigo-600 font-bold">
                  {percentCompleted}% Answered
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Font Size Adjuster for Young Readers */}
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  fontSize === 'normal' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
                title="Normal Font"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  fontSize === 'large' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
                title="Large Font"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  fontSize === 'xlarge' ? 'bg-white text-indigo-700 shadow-2xs text-sm font-black' : 'hover:text-slate-900'
                }`}
                title="Extra Large Font"
              >
                A++
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors hidden sm:flex items-center gap-1"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Autosave Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
              {autosaveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-slate-600 font-semibold">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  Saving...
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Saved
                </span>
              )}
              {autosaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Retrying save...
                </span>
              )}
            </div>

            {/* Countdown Timer */}
            <ExamTimer
              startedAt={attempt.started_at}
              durationMinutes={paper.duration_minutes}
              onTimeExpired={handleSubmitExam}
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Top Progress Track */}
        <div className="max-w-7xl mx-auto mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Card & Controls (3 cols on desktop) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          {currentQ ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                {/* Section & Marks Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {currentQ.subject?.name || (currentQ as any).subject_name || 'Navodaya Entrance'}
                    </span>
                    {currentQ.topic?.name && (
                      <span className="text-xs text-slate-500 font-medium">
                        ({currentQ.topic.name})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                      +{currentQ.marks} Marks
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Q {currentIndex + 1} of {questions.length}
                    </span>
                  </div>
                </div>

                {/* Question Directions / Instructions if present */}
                {(currentQ as any).instructions && (
                  <div className="p-3.5 mb-5 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 rounded-2xl border border-indigo-100 text-xs sm:text-sm text-indigo-950 font-medium shadow-2xs">
                    <span className="font-extrabold text-indigo-900 block mb-1">Directions / सूचना:</span>
                    {(currentQ as any).instructions}
                  </div>
                )}

                {/* Question Text */}
                <div className="flex items-start gap-3.5 mb-6">
                  <span className="h-8 w-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {currentQ.question_number}
                  </span>
                  <p className={`font-semibold text-slate-800 ${questionTextClass}`}>
                    {currentQ.question_text}
                  </p>
                </div>

                {/* High-Resolution Visual Reasoning Diagram (With Click-to-Zoom Lightbox!) */}
                {currentQ.question_image_url && (
                  <div className="max-w-3xl mx-auto my-5">
                    <InteractiveQuestionImage
                      src={currentQ.question_image_url}
                      alt={`Figure for Question ${currentQ.question_number}`}
                      questionNumber={currentQ.question_number}
                      maxHeightClass="max-h-72 sm:max-h-80"
                    />
                  </div>
                )}

                {/* Multiple Choice Options (A, B, C, D) with Keyboard hints */}
                <div className="space-y-3.5 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer?.selected_option_id === opt.id;
                    const keyboardHint = ['1', '2', '3', '4'][optIdx] || opt.option_label;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id, opt.option_label)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 hover:shadow-2xs'
                        }`}
                      >
                        <span
                          className={`h-9 w-9 rounded-xl font-black text-sm flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700'
                          }`}
                        >
                          {opt.option_label}
                        </span>

                        <span className={`font-medium text-slate-800 flex-1 leading-normal ${optionTextClass}`}>
                          {opt.option_text}
                        </span>

                        {/* Optional option image if present */}
                        {opt.option_image_url && (
                          <img
                            src={opt.option_image_url}
                            alt={`Option ${opt.option_label}`}
                            className="h-12 w-auto object-contain rounded-lg border border-slate-200 bg-white p-1"
                          />
                        )}

                        {/* Keyboard shortcut hint */}
                        <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {keyboardHint}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleReview}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentAnswer?.is_marked_for_review
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                    title="Shortcut: Press 'M'"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>
                      {currentAnswer?.is_marked_for_review ? 'Marked for Review' : 'Mark for Review (M)'}
                    </span>
                  </button>

                  {currentAnswer?.selected_option_id && (
                    <button
                      type="button"
                      onClick={handleClearAnswer}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
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
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Previous Question (Left Arrow)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Next Question (Right Arrow)"
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

          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs text-xs space-y-2 text-slate-600">
            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Exam Tips & Shortcuts:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600 pl-4 list-disc">
              <li>Click any diagram to enlarge & zoom into geometric patterns.</li>
              <li>Press <strong>1, 2, 3, 4</strong> or <strong>A, B, C, D</strong> on keyboard to answer instantly.</li>
              <li>Press <strong>M</strong> to flag uncertain questions for review.</li>
              <li>Use <strong>←</strong> and <strong>→</strong> keys to jump between questions.</li>
            </ul>
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
