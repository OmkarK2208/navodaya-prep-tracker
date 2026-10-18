'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  History,
  BookOpen,
  Settings,
  LogOut,
  UserCheck,
  ShieldCheck,
  Flame,
  Menu,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Profile } from '@/types/database';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleRoleSwitch = async (newRole: 'admin' | 'student') => {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        if (newRole === 'admin') {
          router.push('/admin');
        } else {
          router.push('/student');
        }
      }
    } catch {
      // ignore
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/login');
  };

  // Hide navbar on full-screen timed exam interface to minimize distractions
  if (pathname.includes('/student/exam/') && !pathname.includes('/instructions') && !pathname.includes('/submitted')) {
    return null;
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href={isAdmin ? '/admin' : '/student'} className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
                  Navodaya<span className="text-indigo-600">Prep</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">JNVST Selection Tracker</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!isAdmin ? (
              <>
                <Link
                  href="/student"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/student'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </span>
                </Link>
                <Link
                  href="/student/papers"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/student/papers')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" /> Daily Papers
                  </span>
                </Link>
                <Link
                  href="/student/reports"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/student/reports'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <History className="h-4 w-4" /> Progress Reports
                  </span>
                </Link>
                <Link
                  href="/student/revision"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/student/revision'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Weak Topics Revision
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Admin Overview
                  </span>
                </Link>
                <Link
                  href="/admin/papers"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/papers')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Manage Papers
                  </span>
                </Link>
                <Link
                  href="/admin/pdf-generator"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/pdf-generator')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" /> PDF Generator
                  </span>
                </Link>
                <Link
                  href="/admin/students"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin/students'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" /> Student Submissions
                  </span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Action: Role Badge & Quick Switcher */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => handleRoleSwitch(isAdmin ? 'student' : 'admin')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isAdmin
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                  title="Click to switch role between Admin and Student"
                >
                  {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  <span>{isAdmin ? 'Admin View' : 'Student View'}</span>
                  <RefreshCw className={`h-3 w-3 ml-0.5 ${switching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}

            {currentUser ? (
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {!isAdmin ? (
            <>
              <Link
                href="/student"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/student/papers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Daily Papers
              </Link>
              <Link
                href="/student/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Progress Reports
              </Link>
              <Link
                href="/student/revision"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Weak Topics Revision
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Admin Overview
              </Link>
              <Link
                href="/admin/papers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Manage Papers
              </Link>
              <Link
                href="/admin/pdf-generator"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" /> PDF Generator
              </Link>
              <Link
                href="/admin/students"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Student Submissions
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
