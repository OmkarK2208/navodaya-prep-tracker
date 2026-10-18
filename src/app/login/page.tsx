'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldCheck, UserCheck, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('sister@navodaya.local');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (role: 'student' | 'admin') => {
    setActiveTab(role);
    setError(null);
    if (role === 'student') {
      setEmail('sister@navodaya.local');
      setPassword('student123');
    } else {
      setEmail('admin@navodaya.local');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: activeTab }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'student' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      const defaultEmail = role === 'student' ? 'sister@navodaya.local' : 'admin@navodaya.local';
      const defaultPassword = role === 'student' ? 'student123' : 'admin123';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: defaultEmail, password: defaultPassword, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quick login failed');

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-md shadow-indigo-100 mb-3">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to NavodayaPrep</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose your role to continue your exam preparation
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'student'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Student (Sister)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Admin (Mentor)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={activeTab === 'student' ? 'sister@navodaya.local' : 'admin@navodaya.local'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? 'Signing in...' : `Enter as ${activeTab === 'student' ? 'Student' : 'Admin'}`}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick One-Click Switcher for Development & Local Pair Testing */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
            One-Click Quick Start
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              className="py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
            >
              🚀 Sister (Ananya)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="py-2 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
            >
              🛡️ Brother (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
