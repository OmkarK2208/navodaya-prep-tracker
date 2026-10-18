'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Paper, ExamAttempt } from '@/types/database';

export default function StudentPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/papers?publishedOnly=true').then((r) => r.json()),
      fetch('/api/student/dashboard').then((r) => r.json()),
    ])
      .then(([papersData, dashData]) => {
        if (papersData.papers) setPapers(papersData.papers);
        if (dashData.stats?.recent_attempts) setAttempts(dashData.stats.recent_attempts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Available Daily Papers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Published exam papers ready for practice and time-trial evaluation
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading daily papers...</div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Published Papers Available Today</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Your mentor has not published any active exam papers yet. Check back soon or switch to Admin mode to upload one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => {
            const attempt = attempts.find((a) => a.paper_id === paper.id);
            const isCompleted = attempt && attempt.status === 'submitted';

            return (
              <div
                key={paper.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                      JNVST Pattern
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {paper.title}
                  </h3>

                  {paper.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{paper.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[11px] text-slate-500">Duration</div>
                      <div className="font-bold text-xs text-slate-800">{paper.duration_minutes}m</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[11px] text-slate-500">Marks</div>
                      <div className="font-bold text-xs text-slate-800">{paper.total_marks}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[11px] text-slate-500">Questions</div>
                      <div className="font-bold text-xs text-slate-800">{paper.question_count || 10}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isCompleted ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs">
                        <div className="text-slate-500">Your Score</div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {attempt.total_score} / {attempt.max_marks} ({attempt.percentage}%)
                        </div>
                      </div>
                      <Link
                        href={`/student/results/${attempt.id}`}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                      >
                        Solutions
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/student/exam/${paper.id}/instructions`}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Take Exam</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
