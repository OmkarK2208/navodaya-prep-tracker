import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

interface Props {
  params: Promise<{ paperId: string }>;
}

export async function GET(req: Request, props: Props) {
  try {
    const { paperId } = await props.params;
    const { searchParams } = new URL(req.url);
    const forExam = searchParams.get('mode') === 'exam';

    const user = await getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const hideCorrect = forExam || !isAdmin;

    const repo = getDataRepository();
    const paper = await repo.getPaperById(paperId, { hideCorrectAnswers: hideCorrect });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // If student and paper is not published, reject
    if (!isAdmin && !paper.is_published) {
      return NextResponse.json({ error: 'Paper is not currently published' }, { status: 403 });
    }

    return NextResponse.json({ paper });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch paper' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { paperId } = await props.params;
    const body = await req.json();

    const repo = getDataRepository();
    const updated = await repo.updatePaper(paperId, body);

    if (!updated) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json({ paper: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update paper' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { paperId } = await props.params;
    const repo = getDataRepository();
    const ok = await repo.deletePaper(paperId);

    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete paper' }, { status: 500 });
  }
}
