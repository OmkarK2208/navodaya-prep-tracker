import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    const repo = getDataRepository();
    const existing = await repo.getAttempt(attemptId);
    if (!existing) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (existing.student_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized attempt access' }, { status: 403 });
    }

    // Submit and evaluate authoritative result
    const evaluatedAttempt = await repo.submitAttempt(attemptId);

    return NextResponse.json({
      success: true,
      attempt: evaluatedAttempt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Submission evaluation failed' }, { status: 500 });
  }
}
