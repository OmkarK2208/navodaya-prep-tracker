import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Target,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();

  // If user is already authenticated, take them directly to their portal
  if (user) {
    if (user.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/student');
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
        <Sparkles className="h-3.5 w-3.5" />
        <span>JNVST Entrance Exam 2026 Preparation Suite</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
        Master Navodaya with <span className="text-indigo-600">Daily Timed Exams</span> & Intelligent Tracking
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
        Practice realistic online exams covering Mental Ability, Arithmetic, and Language.
        Instant evaluations, step-by-step wrong answer solutions, and personalized weak topic revision.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
        <Link
          href="/student"
          className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
        >
          <span>Open Student Portal</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/admin"
          className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all"
        >
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Admin / Mentor Portal</span>
        </Link>
      </div>

      {/* Key Feature Highlights */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Authoritative Timed Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Countdown timer with auto-submit, autosave resilience, and question navigation palette matching the official JNVST format.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Instant Solutions & Explanations</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automatic evaluation with age-appropriate solutions for wrong answers, allowing immediate retry and understanding.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Weak Topics & Progress</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automatic tracking of missed questions into a targeted revision queue so weak concepts turn into masteries.
          </p>
        </div>
      </div>
    </div>
  );
}
