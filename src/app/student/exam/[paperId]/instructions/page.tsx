'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Bookmark,
} from 'lucide-react';
import { Paper } from '@/types/database';

export default function ExamInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetch(`/api/papers/${paperId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.paper) setPaper(data.paper);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paperId]);

  const handleStartExam = async () => {
    if (!agreed) return;
    setStarting(true);
    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });
      const data = await res.json();
      if (data.attempt) {
        router.push(`/student/exam/${paperId}`);
      }
    } catch {
      router.push(`/student/exam/${paperId}`);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading exam guidelines...</div>;
  }

  if (!paper) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-900">Paper Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">This exam paper is unavailable or removed.</p>
        <Link
          href="/student/papers"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Daily Papers
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/student/papers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Available Papers
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
            Jawahar Navodaya Vidyalaya Selection Test
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {paper.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{paper.description}</p>
        </div>

        {/* Exam Specifications */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div>
            <div className="text-xs text-slate-500">Total Duration</div>
            <div className="font-extrabold text-base text-slate-900">{paper.duration_minutes} Mins</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Marks</div>
            <div className="font-extrabold text-base text-slate-900">{paper.total_marks} Marks</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Questions</div>
            <div className="font-extrabold text-base text-slate-900">{paper.question_count || 10}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Negative Marking</div>
            <div className="font-extrabold text-base text-slate-900">
              {paper.negative_marking_per_question > 0
                ? `-${paper.negative_marking_per_question} per wrong`
                : 'None (0.0)'}
            </div>
          </div>
        </div>

        {/* Important Guidelines for Sister */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Instructions & Guidelines</h2>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Authoritative Countdown:</strong> The exam timer starts immediately upon clicking Begin. It is synchronized with the server and will submit automatically when time expires.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Autosave:</strong> Every option you click is saved automatically in the background. You can navigate between questions freely using Previous, Next, or the Question Palette.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Mark for Review:</strong> If you are unsure of an answer, use the <Bookmark className="h-3.5 w-3.5 inline text-purple-600" /> &quot;Mark for Review&quot; button to revisit it before final submission.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Solution Explanations:</strong> After submission, you will see your score and full step-by-step explanations for every question so you can learn from any mistakes.
              </span>
            </li>
          </ul>
        </div>

        {/* Color Legend */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-800 mb-2">Question Palette Status Colors:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold">1</span>
              <span className="text-slate-700">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold">2</span>
              <span className="text-slate-700">Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-bold">3</span>
              <span className="text-slate-700">Unanswered</span>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-3 p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-700">
            I have read and understood all the exam guidelines. I am sitting in a quiet place and ready to solve the paper within the allotted time.
          </span>
        </label>

        {/* Launch Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!agreed || starting}
            onClick={handleStartExam}
            className={`px-6 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              agreed && !starting
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:scale-[1.02]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {starting ? 'Setting up Exam...' : 'I am Ready, Begin Exam'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
