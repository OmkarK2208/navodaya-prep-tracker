import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { DatabaseStatusBanner } from '@/components/DatabaseStatusBanner';


export const metadata: Metadata = {
  title: 'Navodaya Prep Tracker | JNVST Entrance Exam Preparation',
  description: 'Complete examination engine, daily practice papers, and performance analytics for Jawahar Navodaya Vidyalaya entrance preparation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
        <Suspense fallback={null}>
          <DatabaseStatusBanner />
        </Suspense>
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Navbar />
        </Suspense>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">Loading...</div>}>
          <main className="flex-1 flex flex-col">{children}</main>
        </Suspense>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong>Navodaya Prep Tracker</strong> • Designed for JNVST Class 6 & 9 Selection Success
            </div>
            <div>
              Built with Next.js, TypeScript, Tailwind CSS & Supabase
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
