import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';

export async function GET() {
  try {
    const repo = getDataRepository();
    const subjects = await repo.getSubjects();
    const topics = await repo.getTopics();

    return NextResponse.json({
      subjects,
      topics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch subjects' }, { status: 500 });
  }
}
