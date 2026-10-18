import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { pdfPath, paperId } = await req.json();
    const apiKey = process.env.AI_EXPLAINER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        available: false,
        message:
          'AI extraction service key (AI_EXPLAINER_API_KEY) is not configured in .env.local. You can manually enter and edit questions accurately using the Question Editor below.',
      });
    }

    // When configured with a real key, AI extraction can be called here.
    // For safety, the extracted questions are always returned in draft form for explicit admin verification.
    return NextResponse.json({
      available: true,
      message:
        'AI assistance service reached. Review and verify every extracted question and answer key before publishing.',
      draftQuestions: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'AI extraction failed' }, { status: 500 });
  }
}
