'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ExamAttempt, StudentDashboardStats } from '@/types/database';
import { formatStudyTime } from '@/components/study/StudyTracker';

export default function AdminStudentsPage() {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const attempts = stats?.recent_attempts || [];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admin Overview
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Student Profile & Submissions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor Ananya&apos;s daily activity, total study hours, and historical exam attempts
          </p>
        </div>

        <a
          href="/api/admin/export-csv"
          download
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Export All Results (CSV)</span>
        </a>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            A
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
              <CheckCircle2 className="h-3 w-3" /> Registered Student
            </div>
            <h2 className="text-xl font-bold text-slate-900">Ananya Sharma</h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>sister@navodaya.local</span>
              <span>•</span>
              <span>Target: JNVST Class 6 Selection 2026</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6 text-center">
          <div>
            <div className="text-xs text-slate-500 font-medium">Daily Streak</div>
            <div className="text-2xl font-extrabold text-amber-600">
              {stats?.current_streak_days || 0} Days
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Study Time Today</div>
            <div className="text-2xl font-extrabold text-purple-600">
              {formatStudyTime(stats?.study_time_today_seconds || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Solved</div>
            <div className="text-2xl font-extrabold text-indigo-600">
              {stats?.total_questions_solved || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Exam Attempt History</h2>

        {attempts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No exams attempted by Ananya yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Paper Title</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Score Obtained</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {att.paper?.title || 'Daily Model Paper'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(att.submitted_at || att.started_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {att.total_score} / {att.max_marks} marks
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-emerald-600">{att.percentage}%</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{att.accuracy_percentage}%</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {Math.round((att.time_spent_seconds || 0) / 60)} mins
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/student/results/${att.id}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                      >
                        Inspect Result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
