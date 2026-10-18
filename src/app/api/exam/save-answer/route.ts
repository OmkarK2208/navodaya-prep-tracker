import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      attemptId,
      questionId,
      selectedOptionId,
      selectedOptionLabel,
      isMarkedForReview,
      timeSpentSeconds,
    } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: 'attemptId and questionId are required' }, { status: 400 });
    }

    const repo = getDataRepository();
    const attempt = await repo.getAttempt(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.student_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized for this attempt' }, { status: 403 });
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Exam is already submitted or closed' }, { status: 400 });
    }

    const answer = await repo.saveAttemptAnswer(
      attemptId,
      questionId,
      selectedOptionId || null,
      selectedOptionLabel || null,
      !!isMarkedForReview,
      Number(timeSpentSeconds) || 0
    );

    return NextResponse.json({
      success: true,
      answer,
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Autosave failed' }, { status: 500 });
  }
}
