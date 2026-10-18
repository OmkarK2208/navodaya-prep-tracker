import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // If Supabase Storage is available, upload to private bucket
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'exam-papers';
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(sanitizedName, buffer, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (!error && data) {
            return NextResponse.json({
              success: true,
              filename: sanitizedName,
              storagePath: data.path,
              storageProvider: 'supabase',
              viewUrl: `/api/storage/pdf/${encodeURIComponent(sanitizedName)}`,
            });
          }
        }
      } catch {
        // Fall back to local file storage
      }
    }

    // Safe file storage (with fallback for Vercel Serverless EROFS)
    let uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const testFile = path.join(uploadDir, `.test_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
    } catch {
      uploadDir = path.join(require('os').tmpdir(), 'navodaya_uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }

    const filePath = path.join(uploadDir, sanitizedName);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename: sanitizedName,
      storagePath: `/uploads/${sanitizedName}`,
      storageProvider: 'local',
      viewUrl: `/uploads/${sanitizedName}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
