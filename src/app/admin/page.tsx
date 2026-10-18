'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  PlusCircle,
  Download,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Paper, ExamAttempt, Profile } from '@/types/database';

export default function AdminDashboardPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/papers').then((r) => r.json()),
      fetch('/api/student/dashboard').then((r) => r.json()),
    ])
      .then(([papersData, dashData]) => {
        if (papersData.papers) setPapers(papersData.papers);
        if (dashData.stats?.recent_attempts) setAttempts(dashData.stats.recent_attempts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const publishedCount = papers.filter((p) => p.is_published).length;
  const draftCount = papers.filter((p) => !p.is_published).length;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Administrator & Mentor Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Navodaya Exam Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create daily papers, configure answer keys, schedule tests, and track your sister&apos;s preparation
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/pdf-generator"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI / OCR PDF Generator</span>
          </Link>
          <Link
            href="/admin/papers/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Manual Paper</span>
          </Link>
          <a
            href="/api/admin/export-csv"
            download
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Papers</span>
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{papers.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {publishedCount} Published • {draftCount} Drafts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Students</span>
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">1</div>
          <div className="text-xs text-slate-500 mt-1">Ananya (Target JNVST 2026)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Tests</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{attempts.length}</div>
          <div className="text-xs text-slate-500 mt-1">Evaluated on server</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Student Avg Score</span>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {attempts.length > 0
              ? `${Math.round(
                  attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length
                )}%`
              : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Average percentage</div>
        </div>
      </div>

      {/* AI / OCR PDF Generator Feature Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>New Feature • Automated Paper Digitization</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Upload Navodaya PDF & Auto-Generate Exam
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Upload question paper PDFs in Marathi or English. Automatically extract questions, options (A, B, C, D), and crop visual reasoning diagrams with zero manual retyping. Verify the answer key and publish in minutes.
          </p>
        </div>
        <Link
          href="/admin/pdf-generator"
          className="px-5 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 group cursor-pointer"
        >
          <span>Launch PDF Generator</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Submissions by Sister */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sister&apos;s Recent Submissions</h2>
            <p className="text-xs text-slate-500">Live attempt records and server evaluations</p>
          </div>
          <Link
            href="/admin/students"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Student Records</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {attempts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No completed attempts yet. Have your sister log in and solve the starter model paper!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Paper Title</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Taken</th>
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
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900">
                        {att.total_score} / {att.max_marks}
                      </span>{' '}
                      <span className="text-emerald-600 font-bold">({att.percentage}%)</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {att.accuracy_percentage}%
                    </td>
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

      {/* Papers Overview Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Exam Papers Repository</h2>
            <p className="text-xs text-slate-500">All created daily papers and practice sets</p>
          </div>
          <Link
            href="/admin/papers"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage All Papers</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {papers.slice(0, 5).map((paper) => (
            <div key={paper.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{paper.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      paper.is_published
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {paper.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {paper.duration_minutes} mins • {paper.total_marks} marks • {paper.question_count || 10} questions
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/papers/${paper.id}/questions`}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs"
                >
                  Edit Questions
                </Link>
                <Link
                  href={`/admin/papers/${paper.id}/settings`}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
