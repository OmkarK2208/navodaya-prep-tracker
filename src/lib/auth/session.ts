import { cookies } from 'next/headers';
import { Profile, UserRole } from '@/types/database';
import { getDataRepository } from '../db';
import { isSupabaseConfigured } from '../supabase/config';
import { createServerSupabaseClient } from '../supabase/server';

const AUTH_COOKIE_NAME = 'navodaya_session';

export interface AuthSession {
  user: Profile;
  token?: string;
  expiresAt: number;
}

export async function getCurrentUser(): Promise<Profile | null> {
  const cookieStore = await cookies();

  // If Supabase is configured, check Supabase Auth session first
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const repo = getDataRepository();
          const profile = await repo.getProfile(authUser.id);
          if (profile) return profile;

          // Default fallback if profile record is just created
          return {
            id: authUser.id,
            email: authUser.email || 'user@navodaya.local',
            full_name: authUser.user_metadata?.full_name || 'Navodaya User',
            role: (authUser.user_metadata?.role as UserRole) || 'student',
            created_at: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Continue to check cookie session
    }
  }

  // Check persistent session cookie
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    // Default to student if no cookie exists in local mode so page doesn't crash
    const repo = getDataRepository();
    const profiles = await repo.getProfiles();
    return profiles.find((p) => p.role === 'student') || null;
  }

  try {
    const parsed: AuthSession = JSON.parse(decodeURIComponent(sessionCookie));
    if (parsed.expiresAt < Date.now()) {
      return null;
    }
    const repo = getDataRepository();
    const profile = await repo.getProfile(parsed.user.id);
    return profile || parsed.user;
  } catch {
    return null;
  }
}

export async function setAuthSession(user: Profile): Promise<void> {
  const cookieStore = await cookies();
  const session: AuthSession = {
    user,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  cookieStore.set(AUTH_COOKIE_NAME, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('UNAUTHORIZED: Admin access required.');
  }
  return user;
}

export async function requireStudent(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Student authentication required.');
  }
  return user;
}
