import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

interface Props {
  params: Promise<{ filename: string }>;
}

export async function GET(req: Request, props: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { filename } = await props.params;
    const decodedName = decodeURIComponent(filename);

    // If Supabase Storage is active, download signed buffer
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'exam-papers';
          const { data, error } = await supabase.storage.from(bucket).download(decodedName);
          if (!error && data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${decodedName}"`,
              },
            });
          }
        }
      } catch {
        // Fall back to local check
      }
    }

    // Check local upload folder
    const localPath = path.resolve(process.cwd(), 'public', 'uploads', decodedName);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${decodedName}"`,
        },
      });
    }

    return NextResponse.json({ error: 'PDF file not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Storage error' }, { status: 500 });
  }
}
