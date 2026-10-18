'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  Brain,
  Calculator,
  Languages,
  BookOpen,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { ExamAttempt, Paper } from '@/types/database';
import { StudyTracker, formatStudyTime } from '@/components/study/StudyTracker';

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);

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
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-xs text-slate-500">
        Loading exam evaluation results...
      </div>
    );
  }

  if (!attempt || !paper) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-900">Result Not Found</h2>
        <Link
          href="/student"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const isExcellent = attempt.percentage >= 80;
  const isGood = attempt.percentage >= 60 && attempt.percentage < 80;

  // Calculate subject breakdown from answers or snapshot
  const subjectBreakdown: Record<string, { total: number; correct: number; wrong: number; marks: number }> = {};
  if (attempt.paper_snapshot?.questions) {
    attempt.paper_snapshot.questions.forEach((q) => {
      const sName = q.subject_name || 'General';
      if (!subjectBreakdown[sName]) {
        subjectBreakdown[sName] = { total: 0, correct: 0, wrong: 0, marks: 0 };
      }
      subjectBreakdown[sName].total++;
      const ans = attempt.answers?.[q.id];
      if (ans?.is_correct) {
        subjectBreakdown[sName].correct++;
        subjectBreakdown[sName].marks += q.marks;
      } else if (ans?.selected_option_id) {
        subjectBreakdown[sName].wrong++;
      }
    });
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <StudyTracker sessionType="solution_review" referenceId={attempt.id} />

      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-xs text-slate-400">
          Attempt ID: {attempt.id.slice(0, 16)}...
        </span>
      </div>

      {/* Main Score Hero Card */}
      <div
        className={`rounded-3xl p-6 sm:p-10 border shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isExcellent
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 border-emerald-500'
            : isGood
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 border-indigo-500'
            : 'bg-gradient-to-r from-amber-600 to-rose-700 border-amber-500'
        }`}
      >
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs">
            Official Server Score Card
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{paper.title}</h1>
          <p className="text-white/80 text-xs sm:text-sm">
            Submitted on {new Date(attempt.submitted_at || attempt.started_at).toLocaleDateString()} at{' '}
            {new Date(attempt.submitted_at || attempt.started_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center shrink-0">
          <div className="text-xs uppercase font-bold text-white/80">Marks Obtained</div>
          <div className="text-4xl sm:text-5xl font-black mt-1">
            {attempt.total_score}
            <span className="text-xl font-medium text-white/70"> / {attempt.max_marks}</span>
          </div>
          <div className="mt-2 text-xs font-bold inline-block px-3 py-1 rounded-full bg-white text-slate-900 shadow-xs">
            {attempt.percentage}% Overall Score
          </div>
        </div>
      </div>

      {/* Primary KPI Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Correct Answers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Correct</span>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{attempt.correct_count}</div>
          <div className="text-xs text-slate-500 mt-0.5">Accurate responses</div>
        </div>

        {/* Wrong Answers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Incorrect</span>
            <XCircle className="h-5 w-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{attempt.wrong_count}</div>
          <div className="text-xs text-slate-500 mt-0.5">Needs solution review</div>
        </div>

        {/* Unanswered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Unanswered</span>
            <HelpCircle className="h-5 w-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{attempt.unanswered_count}</div>
          <div className="text-xs text-slate-500 mt-0.5">Left blank</div>
        </div>

        {/* Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
            <Target className="h-5 w-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{attempt.accuracy_percentage}%</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Time: {Math.round(attempt.time_spent_seconds / 60)} mins
          </div>
        </div>
      </div>

      {/* Prominent Action: Review Solutions for Wrong Answers */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-indigo-950">
            Learn from Mistakes & See Solutions
          </h2>
          <p className="text-xs sm:text-sm text-indigo-700 mt-0.5">
            Check the right answer and age-appropriate explanations for all {attempt.wrong_count + attempt.unanswered_count} missed questions.
          </p>
        </div>
        <Link
          href={`/student/results/${attempt.id}/solutions`}
          className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center gap-2 transition-all shrink-0"
        >
          <span>Review Solutions Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Subject-Wise Performance Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Subject Breakdown</h2>
        <div className="divide-y divide-slate-100">
          {Object.entries(subjectBreakdown).map(([subjectName, data]) => {
            const acc = data.total > 0 ? Math.round((data.correct / (data.correct + data.wrong || 1)) * 100) : 0;
            return (
              <div key={subjectName} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900">{subjectName}</div>
                  <div className="text-xs text-slate-500">
                    Total: {data.total} Questions • {data.correct} Correct • {data.wrong} Wrong
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">Accuracy</span>
                      <span className="text-indigo-600">{acc}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${acc}%` }} />
                    </div>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="text-xs text-slate-500">Marks</div>
                    <div className="text-sm font-bold text-slate-900">+{data.marks}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
