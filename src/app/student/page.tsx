'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Target,
  Trophy,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Brain,
  Calculator,
  Languages,
} from 'lucide-react';
import { StudentDashboardStats, Paper } from '@/types/database';
import { StudyTracker, formatStudyTime } from '@/components/study/StudyTracker';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [availablePapers, setAvailablePapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/student/dashboard').then((r) => r.json()),
      fetch('/api/papers?publishedOnly=true').then((r) => r.json()),
    ])
      .then(([dashData, papersData]) => {
        if (dashData.stats) setStats(dashData.stats);
        if (papersData.papers) setAvailablePapers(papersData.papers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayPaper = availablePapers[0];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <StudyTracker sessionType="practice" />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Target: JNVST Entrance Exam 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, Ananya! 👋
          </h1>
          <p className="text-indigo-100 text-sm max-w-xl">
            Consistency is the secret to clearing Navodaya. Solve today&apos;s paper, review your answers,
            and practice your weak topics!
          </p>
        </div>

        {/* Today's Call to Action */}
        {todayPaper ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div>
              <div className="text-xs text-indigo-200 font-medium">Today&apos;s Scheduled Paper</div>
              <div className="text-base font-bold text-white line-clamp-1">{todayPaper.title}</div>
              <div className="text-xs text-indigo-100 mt-0.5">
                {todayPaper.duration_minutes} mins • {todayPaper.total_marks} marks
              </div>
            </div>
            <Link
              href={`/student/exam/${todayPaper.id}/instructions`}
              className="px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Start Today&apos;s Paper</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Exam Streak</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats?.current_streak_days || 0}{' '}
            <span className="text-sm font-semibold text-slate-500">days</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Keep solving daily to build your habit!</div>
        </div>

        {/* Papers Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Papers Attempted</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats?.total_papers_attempted || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats?.today_completed_papers_count || 0} completed today
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Accuracy</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats?.overall_accuracy_percentage ? `${stats.overall_accuracy_percentage}%` : '0%'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats?.total_questions_solved || 0} questions solved
          </div>
        </div>

        {/* Active Study Time Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Study Time Today</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatStudyTime(stats?.study_time_today_seconds || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Active time in exams & review</div>
        </div>
      </div>

      {/* Secondary Metrics: Latest / Best / Average Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Latest Exam Score</div>
            <div className="text-lg font-bold text-slate-900">
              {stats?.latest_score !== null ? `${stats?.latest_score} marks` : 'No attempts yet'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Personal Best Score</div>
            <div className="text-lg font-bold text-slate-900">
              {stats?.best_score !== null ? `${stats?.best_score} marks` : 'No attempts yet'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Average Score</div>
            <div className="text-lg font-bold text-slate-900">
              {stats?.average_score !== null ? `${stats?.average_score} marks` : 'No attempts yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Performance Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Subject-wise Readiness</h2>
            <p className="text-xs text-slate-500">Official JNVST 3-section syllabus breakdown</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mental Ability */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Mental Ability Test (MAT)</h3>
                <span className="text-xs text-slate-500">40 Questions • 50 Marks</span>
              </div>
            </div>
            {(() => {
              const s = stats?.subject_progress.find((sub) => sub.subject_code === 'MAT');
              const acc = s?.accuracy_percentage || 0;
              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Accuracy</span>
                      <span className="text-indigo-600">{acc}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${acc}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span>Solved: <strong>{s?.attempted_count || 0}</strong></span>
                    <span>Correct: <strong className="text-emerald-600">{s?.correct_count || 0}</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Arithmetic */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Arithmetic Test (Math)</h3>
                <span className="text-xs text-slate-500">20 Questions • 25 Marks</span>
              </div>
            </div>
            {(() => {
              const s = stats?.subject_progress.find((sub) => sub.subject_code === 'MATH');
              const acc = s?.accuracy_percentage || 0;
              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Accuracy</span>
                      <span className="text-emerald-600">{acc}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${acc}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span>Solved: <strong>{s?.attempted_count || 0}</strong></span>
                    <span>Correct: <strong className="text-emerald-600">{s?.correct_count || 0}</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Language */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Language Test (Passages)</h3>
                <span className="text-xs text-slate-500">20 Questions • 25 Marks</span>
              </div>
            </div>
            {(() => {
              const s = stats?.subject_progress.find((sub) => sub.subject_code === 'LANG');
              const acc = s?.accuracy_percentage || 0;
              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Accuracy</span>
                      <span className="text-amber-600">{acc}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${acc}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span>Solved: <strong>{s?.attempted_count || 0}</strong></span>
                    <span>Correct: <strong className="text-emerald-600">{s?.correct_count || 0}</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Grid: Weak Topics Revisions & Weekly Performance Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weak Topics Needing Revision */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Weak Topics to Revise</h2>
              <p className="text-xs text-slate-500">Auto-detected from missed exam questions</p>
            </div>
            <Link
              href="/student/revision"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Practice Queue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {stats?.weak_topics && stats.weak_topics.length > 0 ? (
            <div className="space-y-3">
              {stats.weak_topics.map((item) => (
                <div
                  key={item.topic_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.topic_name}</div>
                    <div className="text-[11px] text-slate-500">{item.subject_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[11px] border border-rose-200">
                      {item.missed_count} missed
                    </span>
                    <Link
                      href="/student/revision"
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold"
                    >
                      Revise
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">No Weak Topics Right Now!</div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Take today&apos;s exam paper. Any missed questions will automatically queue up here for targeted practice.
              </p>
            </div>
          )}
        </div>

        {/* Weekly Performance Graph */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Weekly Performance Trend</h2>
              <p className="text-xs text-slate-500">Average score % over the past 7 days</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats?.weekly_performance && stats.weekly_performance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekly_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Complete your first exam to see weekly trend charts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Attempts History */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Exam Attempts</h2>
            <p className="text-xs text-slate-500">Review your past scores and solutions</p>
          </div>
          <Link
            href="/student/papers"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>All Daily Papers</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats?.recent_attempts && stats.recent_attempts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recent_attempts.map((att) => (
              <div key={att.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">{att.paper?.title || 'Daily Model Paper'}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(att.submitted_at || att.started_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{Math.round((att.time_spent_seconds || 0) / 60)} mins</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900">
                      {att.total_score} / {att.max_marks} marks
                    </div>
                    <div className="text-xs font-semibold text-emerald-600">{att.percentage}% Score</div>
                  </div>
                  <Link
                    href={`/student/results/${att.id}`}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
                  >
                    View Result
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No completed exams yet. Start your first exam above!
          </div>
        )}
      </div>
    </div>
  );
}
