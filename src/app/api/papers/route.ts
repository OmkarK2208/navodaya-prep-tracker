import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get('publishedOnly') === 'true';

    const user = await getCurrentUser();
    const repo = getDataRepository();

    // If user is student, enforce publishedOnly
    const isStudent = !user || user.role === 'student';
    const papers = await repo.getPapers({
      publishedOnly: isStudent || publishedOnly,
    });

    return NextResponse.json({ papers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch papers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const repo = getDataRepository();
    const paper = await repo.createPaper({
      title: body.title,
      description: body.description,
      pdf_path: body.pdf_path,
      duration_minutes: Number(body.duration_minutes) || 120,
      total_marks: Number(body.total_marks) || 100,
      negative_marking_per_question: Number(body.negative_marking_per_question) || 0,
      is_published: !!body.is_published,
      available_from: body.available_from,
      available_until: body.available_until,
      created_by: user.id,
    });

    return NextResponse.json({ paper });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create paper' }, { status: 500 });
  }
}
