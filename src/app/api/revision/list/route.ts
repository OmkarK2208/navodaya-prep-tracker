import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    const repo = getDataRepository();
    const studentId = user.role === 'admin' ? 'student-00000000-0000-0000-0000-000000000002' : user.id;
    const items = await repo.getRevisionItems(studentId);

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch revision items' }, { status: 500 });
  }
}
