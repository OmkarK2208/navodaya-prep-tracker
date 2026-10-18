'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Calendar,
} from 'lucide-react';
import { Paper } from '@/types/database';

export default function PaperSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [totalMarks, setTotalMarks] = useState(100);
  const [negativeMarking, setNegativeMarking] = useState(0.0);
  const [isPublished, setIsPublished] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/papers/${paperId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.paper) {
          setPaper(data.paper);
          setTitle(data.paper.title);
          setDescription(data.paper.description || '');
          setDurationMinutes(data.paper.duration_minutes);
          setTotalMarks(data.paper.total_marks);
          setNegativeMarking(data.paper.negative_marking_per_question);
          setIsPublished(data.paper.is_published);
          if (data.paper.available_from) {
            setAvailableFrom(data.paper.available_from.slice(0, 16));
          }
          if (data.paper.available_until) {
            setAvailableUntil(data.paper.available_until.slice(0, 16));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paperId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: Number(durationMinutes),
          total_marks: Number(totalMarks),
          negative_marking_per_question: Number(negativeMarking),
          is_published: isPublished,
          available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
          available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update paper settings');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !paper) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading paper configuration...</div>;
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/admin/papers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Papers List
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="pb-6 mb-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Paper Scheduling & Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust exam time limits, scoring policies, and student availability windows
            </p>
          </div>
          <Link
            href={`/admin/papers/${paperId}/questions`}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold"
          >
            Go to Question Editor
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Paper Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                step="0.25"
                required
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Negative Marking (per wrong)
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Available From (Optional)
              </label>
              <input
                type="datetime-local"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Available Until (Optional)
              </label>
              <input
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Publish to Student Portal
              </span>
              <span className="text-xs text-slate-500">
                When checked, your sister will be able to see and solve this examination.
              </span>
            </div>
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
