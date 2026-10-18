'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  totalQuestions: number;
  answeredCount: number;
  reviewCount: number;
  unansweredCount: number;
}

export function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  totalQuestions,
  answeredCount,
  reviewCount,
  unansweredCount,
}: SubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95">
        <button
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Exam Submission</h3>
            <p className="text-xs text-slate-500">Are you ready to submit your answers?</p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-4 text-sm">
          <div className="flex justify-between items-center text-slate-600">
            <span>Total Questions:</span>
            <span className="font-bold text-slate-900">{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-700">
            <span>Answered:</span>
            <span className="font-bold">{answeredCount}</span>
          </div>
          <div className="flex justify-between items-center text-purple-700">
            <span>Marked for Review:</span>
            <span className="font-bold">{reviewCount}</span>
          </div>
          <div className="flex justify-between items-center text-amber-700">
            <span>Unanswered:</span>
            <span className="font-bold">{unansweredCount}</span>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong>Warning:</strong> You still have <strong>{unansweredCount}</strong> unanswered
              question{unansweredCount > 1 ? 's' : ''}. You will not receive any marks for unanswered questions.
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Go Back & Review
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? 'Evaluating...' : 'Yes, Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
