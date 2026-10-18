import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    const { sessionType, activeSeconds, referenceId } = await req.json();
    const duration = Math.min(Math.max(1, Number(activeSeconds) || 15), 120); // Cap at 2 mins per heartbeat to prevent idle cheating

    const repo = getDataRepository();
    const session = await repo.recordStudySession(
      user.id,
      sessionType || 'practice',
      duration,
      referenceId || null
    );

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Heartbeat failed' }, { status: 500 });
  }
}
