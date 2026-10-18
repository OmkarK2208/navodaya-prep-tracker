'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Award, ArrowRight, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

function ExamSubmittedContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-4 max-w-xl mx-auto text-center">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl shadow-slate-100 w-full space-y-6">
        <div className="inline-flex h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center shadow-lg shadow-emerald-50 mb-2">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Exam Submitted Successfully! 🎉
          </h1>
          <p className="text-sm text-slate-600">
            Great job! Your answers have been recorded and authoritatively evaluated by the server.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div>Your attempt score, subject breakdown, and full step-by-step solutions are ready.</div>
          <div className="font-semibold text-slate-800">
            Reviewing wrong questions helps you improve your score the fastest!
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {attemptId ? (
            <Link
              href={`/student/results/${attemptId}`}
              className="flex-1 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
            >
              <span>View Detailed Result</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <Link
            href="/student"
            className="py-3.5 px-6 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ExamSubmittedPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading confirmation...</div>}>
      <ExamSubmittedContent />
    </Suspense>
  );
}
