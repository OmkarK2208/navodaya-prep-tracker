import { NextResponse } from 'next/server';
import { clearAuthSession } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
  }

  await clearAuthSession();
  return NextResponse.json({ success: true });
}
