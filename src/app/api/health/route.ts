import { NextResponse } from 'next/server';
import { getDataRepository, getRepositoryMode } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET() {
  try {
    const repo = getDataRepository();
    const mode = getRepositoryMode();
    const papers = await repo.getPapers();
    const subjects = await repo.getSubjects();

    return NextResponse.json({
      status: 'healthy',
      mode,
      supabaseConfigured: isSupabaseConfigured(),
      papersCount: papers.length,
      subjectsCount: subjects.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database connection check failed',
      },
      { status: 500 }
    );
  }
}
