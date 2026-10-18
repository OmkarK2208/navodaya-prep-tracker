'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';

export function DatabaseStatusBanner() {
  const [status, setStatus] = useState<{
    mode: 'supabase' | 'local';
    supabaseConfigured: boolean;
    papersCount: number;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'healthy') {
          setStatus({
            mode: data.mode,
            supabaseConfigured: data.supabaseConfigured,
            papersCount: data.papersCount,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <>
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              Database Engine:{' '}
              {status.mode === 'supabase' ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Supabase PostgreSQL (Cloud Active)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <CheckCircle2 className="h-3 w-3" /> Local Persistent Database (Pre-seeded & Fully Active)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Timezone: Asia/Kolkata</span>
            <button
              onClick={() => setShowModal(true)}
              className="text-indigo-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="h-3 w-3" /> Supabase Setup Guide
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" /> Database & Supabase Guide
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Your app is currently running seamlessly with{' '}
              <strong>persistent disk storage</strong>. All papers, daily exams, student scores, and
              revision records persist safely across refreshes and restarts!
            </p>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-700">To connect your live Supabase project:</div>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                <li>Create a free project at <span className="text-indigo-600 font-mono">supabase.com</span></li>
                <li>Go to <strong>SQL Editor</strong> in Supabase and paste the contents of:
                  <div className="font-mono text-[11px] bg-slate-200 p-1.5 rounded mt-1 select-all">
                    supabase/migrations/20261018000000_navodaya_schema.sql
                  </div>
                </li>
                <li>Copy your <strong>Project URL</strong>, <strong>Anon Key</strong>, and <strong>Service Role Key</strong>.</li>
                <li>Paste them into your local <code className="bg-slate-200 px-1 py-0.5 rounded">.env.local</code> file and restart Next.js!</li>
              </ol>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
