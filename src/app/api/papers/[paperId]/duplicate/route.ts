import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

interface Props {
  params: Promise<{ paperId: string }>;
}

export async function POST(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { paperId } = await props.params;
    let newTitle: string | undefined;
    try {
      const body = await req.json();
      newTitle = body.title;
    } catch {
      // optional body
    }

    const repo = getDataRepository();
    const duplicated = await repo.duplicatePaper(paperId, newTitle);

    if (!duplicated) {
      return NextResponse.json({ error: 'Original paper not found' }, { status: 404 });
    }

    return NextResponse.json({ paper: duplicated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to duplicate paper' }, { status: 500 });
  }
}
