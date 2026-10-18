import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Props {
  params: Promise<{ path: string[] }>;
}

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.gif': 'image/gif',
};

export async function GET(req: Request, props: Props) {
  try {
    const { path: pathSegments } = await props.params;
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const safeSubPath = path.join(...pathSegments);
    let resolvedPath = path.resolve(uploadsDir, safeSubPath);

    if (!fs.existsSync(resolvedPath)) {
      const tmpPath = path.resolve(require('os').tmpdir(), 'navodaya_uploads', safeSubPath);
      if (fs.existsSync(tmpPath)) {
        resolvedPath = tmpPath;
      } else {
        const samplePath = path.resolve(process.cwd(), 'public', 'samples', safeSubPath);
        if (fs.existsSync(samplePath)) {
          resolvedPath = samplePath;
        } else {
          return NextResponse.json({ error: 'File not found on disk', path: safeSubPath }, { status: 404 });
        }
      }
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    const fileBuffer = fs.readFileSync(resolvedPath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error('Error serving upload:', err);
    return NextResponse.json({ error: err?.message || 'Failed to serve file' }, { status: 500 });
  }
}
