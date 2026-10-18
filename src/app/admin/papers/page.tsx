'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Copy,
  Trash2,
  Settings,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { Paper } from '@/types/database';

export default function AdminPapersListPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPapers = () => {
    setLoading(true);
    fetch('/api/papers')
      .then((res) => res.json())
      .then((data) => {
        if (data.papers) setPapers(data.papers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const handleDuplicate = async (paperId: string) => {
    setActionLoading(`dup-${paperId}`);
    try {
      const res = await fetch(`/api/papers/${paperId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        loadPapers();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (paperId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setActionLoading(`del-${paperId}`);
    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPapers((prev) => prev.filter((p) => p.id !== paperId));
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPapers = papers.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Examination Papers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, duplicate, schedule, and edit interactive question sets
          </p>
        </div>

        <Link
          href="/admin/papers/new"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create New Paper</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search papers by title..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading papers...</div>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-sm">No Papers Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'Try clearing your search query.' : 'Create your first daily paper to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Paper Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Marks</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-slate-900">{paper.title}</div>
                      {paper.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md mt-0.5">
                          {paper.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          paper.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {paper.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {paper.duration_minutes} mins
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {paper.total_marks}
                    </td>
                    <td className="py-4 px-4 font-semibold text-indigo-600">
                      {paper.question_count || 0}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {paper.attempts_count || 0}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/papers/${paper.id}/questions`}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs"
                          title="Edit Questions & Answer Keys"
                        >
                          Questions ({paper.question_count || 0})
                        </Link>

                        <Link
                          href={`/admin/papers/${paper.id}/settings`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Paper Scheduling & Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          disabled={actionLoading === `dup-${paper.id}`}
                          onClick={() => handleDuplicate(paper.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          title="Duplicate Paper"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading === `del-${paper.id}`}
                          onClick={() => handleDelete(paper.id, paper.title)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer"
                          title="Delete Paper"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
