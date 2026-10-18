'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  Brain,
  Calculator,
  Languages,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { StudentDashboardStats } from '@/types/database';
import { formatStudyTime } from '@/components/study/StudyTracker';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function StudentReportsPage() {
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

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Compiling progress reports...</div>;
  }

  const attempts = stats?.recent_attempts || [];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Daily & Weekly Progress Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed performance metrics, subject mastery, and trend analysis based on your saved exam attempts
        </p>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Exams Attempted</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.total_papers_attempted || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Persisted attempts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Overall Accuracy</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {stats?.overall_accuracy_percentage || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all questions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Score</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {stats?.average_score !== null ? `${stats?.average_score}` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Average marks per test</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Study Time Today</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {formatStudyTime(stats?.study_time_today_seconds || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active exam & review time</div>
        </div>
      </div>

      {/* Performance Graph: Score and Accuracy Trend */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Weekly Score & Accuracy Trend</h2>
          <p className="text-xs text-slate-500">
            Real daily test results over the past 7 days (Asia/Kolkata timezone)
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          {stats?.weekly_performance && stats.weekly_performance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weekly_performance} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Exam Score %"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy %"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No exam attempts recorded in the past 7 days.
            </div>
          )}
        </div>
      </div>

      {/* Subject-Wise Mastery Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Official Syllabus Subject Mastery</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Questions Solved</th>
                <th className="py-3 px-4">Correct</th>
                <th className="py-3 px-4">Incorrect</th>
                <th className="py-3 px-4">Marks Obtained</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Avg Speed / Q</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.subject_progress.map((sub) => (
                <tr key={sub.subject_id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {sub.subject_name}
                    <span className="ml-1 text-[11px] text-slate-500 font-normal">({sub.subject_code})</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{sub.attempted_count}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">+{sub.correct_count}</td>
                  <td className="py-3.5 px-4 font-semibold text-rose-600">-{sub.wrong_count}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {sub.marks_obtained} / {sub.total_marks_possible}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        sub.accuracy_percentage >= 80
                          ? 'bg-emerald-50 text-emerald-700'
                          : sub.accuracy_percentage >= 50
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sub.accuracy_percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {sub.average_time_per_question_seconds > 0
                      ? `${sub.average_time_per_question_seconds}s`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations & Action Plan */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Intelligent Study Recommendations</span>
        </div>
        <h3 className="text-xl font-bold">Recommended Next Steps for Ananya</h3>
        <ul className="space-y-2.5 text-xs sm:text-sm text-indigo-100 max-w-2xl">
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
            <span>
              <strong>Target Weak Arithmetic Topics:</strong> Decimal operations and LCM/HCF word problems
              benefit most from repetitive step-by-step practice.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
            <span>
              <strong>Maintain Mental Ability Speed:</strong> Non-verbal figure matching and pattern completion
              should ideally take under 45 seconds per question.
            </span>
          </li>
        </ul>
        <div className="pt-2">
          <Link
            href="/student/papers"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-colors shadow-xs"
          >
            <span>Solve Another Practice Paper</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
