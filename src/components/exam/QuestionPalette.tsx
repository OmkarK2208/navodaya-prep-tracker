'use client';

import React from 'react';
import { Question, AttemptAnswer } from '@/types/database';
import { CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
        <span>Question Palette</span>
        <span className="text-xs font-normal text-slate-500">
          Total: {questions.length} Questions
        </span>
      </h3>

      {/* Status Counters */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
          <div className="text-base font-bold text-emerald-700">{answeredCount}</div>
          <div className="text-[11px] font-medium text-emerald-800 flex items-center justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Answered
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-2">
          <div className="text-base font-bold text-purple-700">{reviewCount}</div>
          <div className="text-[11px] font-medium text-purple-800 flex items-center justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Review
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
          <div className="text-base font-bold text-slate-700">{unansweredCount}</div>
          <div className="text-[11px] font-medium text-slate-600 flex items-center justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-300" /> Unanswered
          </div>
        </div>
      </div>

      {/* Grid of Question Numbers */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const isAnswered = !!ans?.selected_option_id;
          const isReview = !!ans?.is_marked_for_review;
          const isCurrent = currentIndex === idx;

          let btnColor = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
          if (isReview) {
            btnColor = 'bg-purple-600 text-white border-purple-700 shadow-xs';
          } else if (isAnswered) {
            btnColor = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className={`relative h-10 w-full rounded-xl font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${btnColor} ${
                isCurrent ? 'ring-3 ring-indigo-500 ring-offset-2 scale-105 z-10' : ''
              }`}
            >
              {q.question_number}
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
