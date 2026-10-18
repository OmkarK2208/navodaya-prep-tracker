import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

interface Props {
  params: Promise<{ itemId: string }>;
}

export async function POST(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    const { itemId } = await props.params;
    const body = await req.json();
    const mastered = body.mastered !== false;

    const repo = getDataRepository();
    const ok = await repo.markRevisionItemMastered(itemId, mastered);

    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 });
  }
}
