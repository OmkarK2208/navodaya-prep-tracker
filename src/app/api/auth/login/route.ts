import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { setAuthSession } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const repo = getDataRepository();

    // If Supabase is configured, use Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email,
            password: password || 'Navodaya123!',
          });

          if (!authErr && authData.user) {
            let profile = await repo.getProfile(authData.user.id);
            if (!profile) {
              profile = await repo.saveProfile({
                id: authData.user.id,
                email: authData.user.email || email,
                full_name: authData.user.user_metadata?.full_name || (role === 'admin' ? 'Administrator' : 'Student Sister'),
                role: role || (authData.user.user_metadata?.role as any) || 'student',
                created_at: new Date().toISOString(),
              });
            }
            await setAuthSession(profile);
            return NextResponse.json({ success: true, user: profile });
          }
        }
      } catch {
        // Fall back to local profiles
      }
    }

    // Local / Dev Fallback
    const profiles = await repo.getProfiles();
    let targetProfile = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (!targetProfile) {
      // Create new profile if not found
      targetProfile = await repo.saveProfile({
        id: `user-${Date.now()}`,
        email,
        full_name: role === 'admin' ? 'Admin / Mentor' : 'Ananya (Student)',
        role: role || 'student',
        created_at: new Date().toISOString(),
      });
    }

    await setAuthSession(targetProfile);
    return NextResponse.json({ success: true, user: targetProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}
