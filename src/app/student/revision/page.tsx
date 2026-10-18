'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
} from 'lucide-react';
import { RevisionItem } from '@/types/database';
import { StudyTracker } from '@/components/study/StudyTracker';

export default function WeakTopicsRevisionPage() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [masteringId, setMasteringId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then((res) => res.json())
      .then(async () => {
        // Fetch revision items from API or repo
        const revRes = await fetch('/api/revision/list');
        const revData = await revRes.json();
        if (revData.items) setItems(revData.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkMastered = async (itemId: string) => {
    setMasteringId(itemId);
    try {
      const res = await fetch(`/api/revision/${itemId}/mastered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mastered: true }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch {
      // ignore
    } finally {
      setMasteringId(null);
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <StudyTracker sessionType="revision" />

      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Targeted Weak Topics Revision
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Questions you missed during previous exams. Practice them and mark them as mastered once you understand them!
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading revision queue...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Your Revision Queue is Clear! 🎉</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You currently have no unmastered questions in your revision list. Keep taking daily papers to reinforce your skills.
          </p>
          <Link
            href="/student/papers"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
          >
            Take Daily Paper
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const q = item.question;
            if (!q) return null;
            const correctOpt = q.options?.find((opt) => opt.is_correct);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                      {q.subject?.name || 'Syllabus'}
                    </span>
                    {q.topic?.name && (
                      <span className="text-xs text-slate-500">({q.topic.name})</span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Missed {item.missed_count} {item.missed_count === 1 ? 'time' : 'times'}
                  </span>
                </div>

                <p className="text-base font-semibold text-slate-800 leading-relaxed">
                  {q.question_text}
                </p>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                        opt.is_correct
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="h-6 w-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[11px]">
                        {opt.option_label}
                      </span>
                      <span>{opt.option_text}</span>
                      {opt.is_correct && <span className="ml-auto text-emerald-600 font-bold">✓ Correct</span>}
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Explanation:</span>
                    </div>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}

                {/* Mark as Mastered Button */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={masteringId === item.id}
                    onClick={() => handleMarkMastered(item.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{masteringId === item.id ? 'Marking...' : 'I Understand This Now (Mark Mastered)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
