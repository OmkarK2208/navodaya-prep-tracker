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
    const body = await req.json();

    if (!body.question_text) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    if (!body.options || !Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json({ error: 'At least 2 options are required' }, { status: 400 });
    }

    const hasCorrect = body.options.some((opt: any) => opt.is_correct);
    if (!hasCorrect) {
      return NextResponse.json({ error: 'At least one option must be marked as correct' }, { status: 400 });
    }

    const repo = getDataRepository();
    const paper = await repo.getPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const nextQNum = body.question_number || (paper.question_count ? paper.question_count + 1 : 1);

    const question = await repo.addQuestion({
      paper_id: paperId,
      subject_id: body.subject_id,
      topic_id: body.topic_id,
      question_number: nextQNum,
      question_text: body.question_text,
      question_image_url: body.question_image_url,
      marks: Number(body.marks) || 1.25,
      explanation: body.explanation || '',
      options: body.options,
    });

    return NextResponse.json({ question });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to add question' }, { status: 500 });
  }
}
