'use client';

import React, { useState } from 'react';
import { Question, AttemptAnswer } from '@/types/database';
import { Bookmark, CheckCircle2, Layers } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, Partial<AttemptAnswer>>;
  onSelectQuestion: (index: number) => void;
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  onSelectQuestion,
}: QuestionPaletteProps) {
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'MAT' | 'MATH' | 'LANG'>('ALL');

  let answeredCount = 0;
  let reviewCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (ans?.is_marked_for_review) {
      reviewCount++;
    } else if (ans?.selected_option_id) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
  });

  // Filter questions by section if selected
  const displayedQuestions = questions
    .map((q, originalIdx) => ({ q, originalIdx }))
    .filter(({ q }) => {
      if (sectionFilter === 'ALL') return true;
      const num = q.question_number;
      const subjCode = (q as any).subject_code || (q.subject?.name?.toLowerCase().includes('mental') ? 'MAT' : q.subject?.name?.toLowerCase().includes('arithmetic') ? 'MATH' : 'LANG');
      
      if (sectionFilter === 'MAT') return subjCode === 'MAT' || (num >= 1 && num <= 40);
      if (sectionFilter === 'MATH') return subjCode === 'MATH' || (num >= 41 && num <= 60);
      if (sectionFilter === 'LANG') return subjCode === 'LANG' || (num >= 61 && num <= 80);
      return true;
    });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-indigo-600" />
          <span>Question Palette</span>
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {answeredCount} / {questions.length} done
        </span>
      </div>

      {/* Status Summary Pills */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-1">
          <div className="text-sm font-extrabold text-emerald-700">{answeredCount}</div>
          <div className="text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Answered
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl py-2 px-1">
          <div className="text-sm font-extrabold text-purple-700">{reviewCount}</div>
          <div className="text-[10px] font-bold text-purple-800 flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Review
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-1">
          <div className="text-sm font-extrabold text-slate-700">{unansweredCount}</div>
          <div className="text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Left
          </div>
        </div>
      </div>

      {/* Navodaya Section Tabs */}
      {questions.length >= 40 && (
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setSectionFilter('ALL')}
            className={`py-1 rounded-lg transition-all ${
              sectionFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('MAT')}
            className={`py-1 rounded-lg transition-all ${
              sectionFilter === 'MAT' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Mental Ability (Q1-40)"
          >
            MAT
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('MATH')}
            className={`py-1 rounded-lg transition-all ${
              sectionFilter === 'MATH' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Arithmetic (Q41-60)"
          >
            Math
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('LANG')}
            className={`py-1 rounded-lg transition-all ${
              sectionFilter === 'LANG' ? 'bg-amber-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Language (Q61-80)"
          >
            मराठी
          </button>
        </div>
      )}

      {/* Question Number Tiles */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
        {displayedQuestions.map(({ q, originalIdx }) => {
          const ans = answers[q.id];
          const isAnswered = !!ans?.selected_option_id;
          const isReview = !!ans?.is_marked_for_review;
          const isCurrent = currentIndex === originalIdx;

          let btnColor = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
          if (isReview && isAnswered) {
            btnColor = 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-emerald-400';
          } else if (isReview) {
            btnColor = 'bg-purple-600 text-white border-purple-700 shadow-xs';
          } else if (isAnswered) {
            btnColor = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(originalIdx)}
              className={`relative h-10 w-full rounded-xl font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${btnColor} ${
                isCurrent
                  ? 'ring-3 ring-indigo-500 ring-offset-2 scale-105 z-10 shadow-sm'
                  : 'hover:scale-102'
              }`}
            >
              <span>{q.question_number}</span>
              {isReview && (
                <Bookmark className="h-2.5 w-2.5 absolute top-1 right-1 fill-white text-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
