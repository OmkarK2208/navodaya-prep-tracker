import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to take an exam' }, { status: 401 });
    }

    const { paperId } = await req.json();
    if (!paperId) {
      return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 });
    }

    const repo = getDataRepository();
    const paper = await repo.getPaperById(paperId, { hideCorrectAnswers: true });
    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (!paper.is_published && user.role !== 'admin') {
      return NextResponse.json({ error: 'This paper is not published' }, { status: 403 });
    }

    const attempt = await repo.createAttempt(paperId, user.id);

    // Calculate server-authoritative remaining time
    const startedTime = new Date(attempt.started_at).getTime();
    const nowTime = Date.now();
    const totalAllowedSeconds = paper.duration_minutes * 60;
    const elapsedSeconds = Math.max(0, Math.floor((nowTime - startedTime) / 1000));
    const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    return NextResponse.json({
      attempt,
      paper,
      serverTime: new Date().toISOString(),
      startedAt: attempt.started_at,
      totalAllowedSeconds,
      elapsedSeconds,
      remainingSeconds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to start exam' }, { status: 500 });
  }
}
