'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Upload,
  ArrowLeft,
  ArrowRight,
  Clock,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function CreatePaperPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(50);
  const [negativeMarking, setNegativeMarking] = useState(0.0);
  const [isPublished, setIsPublished] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');

  // PDF file upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfStoragePath, setPdfStoragePath] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setUploadingPdf(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setPdfStoragePath(data.storagePath);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Paper title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          pdf_path: pdfStoragePath,
          duration_minutes: Number(durationMinutes),
          total_marks: Number(totalMarks),
          negative_marking_per_question: Number(negativeMarking),
          is_published: isPublished,
          available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
          available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create paper');

      // Redirect immediately to Question Editor to add/verify interactive questions!
      router.push(`/admin/papers/${data.paper.id}/questions`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create paper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/admin/papers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Papers List
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="pb-6 mb-6 border-b border-slate-100">
          <h1 className="text-2xl font-extrabold text-slate-900">Create New Examination Paper</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure the exam paper metadata, upload an optional PDF, and proceed to interactive question authoring
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paper Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Navodaya Model Practice Paper - Day 2"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes for Sister
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 20-question practice focusing on Mental Ability and Arithmetic Decimals."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* PDF Question Paper Upload */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Attach Original Question Paper PDF (Optional)
            </label>
            <p className="text-xs text-slate-500">
              Uploading a PDF securely attaches the original question paper for preview and reference. You will add the interactive question keys in the next step.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                disabled={uploadingPdf}
                className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {uploadingPdf && <span className="text-xs text-slate-500">Uploading to storage...</span>}
              {pdfStoragePath && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> PDF Attached Successfully
                </span>
              )}
            </div>
          </div>

          {/* Duration, Marks, Negative Marking */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500">Default JNVST is 120 mins</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Marks
              </label>
              <input
                type="number"
                step="0.25"
                min={1}
                required
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500">Default JNVST is 100 marks</span>
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
              <span className="text-[11px] text-slate-500">0.0 for standard JNVST</span>
            </div>
          </div>

          {/* Availability Window */}
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

          {/* Publish Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Publish Immediately to Student Portal
              </span>
              <span className="text-xs text-slate-500">
                If unchecked, this paper will remain in draft mode until you finish adding questions and toggle publication.
              </span>
            </div>
          </label>

          {/* Submit & Continue */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              {loading ? 'Creating Paper...' : 'Save & Continue to Question Editor'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
