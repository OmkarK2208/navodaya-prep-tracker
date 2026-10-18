import { NextResponse } from 'next/server';
import { getCurrentUser, setAuthSession } from '@/lib/auth/session';
import { getDataRepository } from '@/lib/db';
import { UserRole } from '@/types/database';

export async function POST(req: Request) {
  try {
    const { targetRole } = await req.json();
    if (!targetRole || !['admin', 'student'].includes(targetRole)) {
      return NextResponse.json({ error: 'Valid targetRole is required' }, { status: 400 });
    }

    const repo = getDataRepository();
    const profiles = await repo.getProfiles();
    let target = profiles.find((p) => p.role === targetRole);

    if (!target) {
      target = await repo.saveProfile({
        id: `user-${targetRole}-${Date.now()}`,
        email: targetRole === 'admin' ? 'admin@navodaya.local' : 'sister@navodaya.local',
        full_name: targetRole === 'admin' ? 'Admin / Mentor' : 'Ananya (Student)',
        role: targetRole as UserRole,
        created_at: new Date().toISOString(),
      });
    }

    await setAuthSession(target);
    return NextResponse.json({ success: true, user: target });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Switch failed' }, { status: 500 });
  }
}
