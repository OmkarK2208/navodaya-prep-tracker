import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

interface Props {
  params: Promise<{ questionId: string }>;
}

export async function PUT(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { questionId } = await props.params;
    const body = await req.json();

    const repo = getDataRepository();
    const updated = await repo.updateQuestion(questionId, body);

    if (!updated) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { questionId } = await props.params;
    const repo = getDataRepository();
    const ok = await repo.deleteQuestion(questionId);

    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete question' }, { status: 500 });
  }
}
