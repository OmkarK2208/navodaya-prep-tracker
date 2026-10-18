import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

interface Props {
  params: Promise<{ attemptId: string }>;
}

export async function GET(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { attemptId } = await props.params;
    const repo = getDataRepository();
    const attempt = await repo.getAttempt(attemptId);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.student_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Load full paper questions (if submitted, includes explanations and correct answers)
    const paper = await repo.getPaperById(attempt.paper_id, {
      hideCorrectAnswers: attempt.status === 'in_progress',
    });

    return NextResponse.json({
      attempt,
      paper,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch attempt' }, { status: 500 });
  }
}
