import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

interface ExtractedQuestion {
  question_number: number;
  subject_code: string;
  subject_name: string;
  question_text: string;
  options: Array<{
    option_label: 'A' | 'B' | 'C' | 'D';
    option_text: string;
    is_correct?: boolean;
  }>;
  question_image_url?: string | null;
  marks: number;
  explanation?: string;
  is_uncertain?: boolean;
  uncertainty_reason?: string | null;
  instructions?: string | null;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || 'mar+eng';

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files (.pdf) are supported' }, { status: 400 });
    }

    // Limit to 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sanitizedBase = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${sanitizedBase}`;
    const localPdfPath = path.join(uploadsDir, filename);
    fs.writeFileSync(localPdfPath, buffer);

    // Upload to Supabase Storage if configured
    let storagePath = `/uploads/${filename}`;
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'exam-papers';
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, buffer, {
              contentType: 'application/pdf',
              upsert: true,
            });
          if (!error && data) {
            storagePath = data.path;
          }
        }
      } catch {
        // Fall back to local
      }
    }

    // Run Python Extractor
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'extract_pdf.py');
    const outputJsonPath = path.join(uploadsDir, `extract_${Date.now()}.json`);

    const extractionResult = await new Promise<{
      success: boolean;
      total_pages?: number;
      is_scanned?: boolean;
      questions?: ExtractedQuestion[];
      error?: string;
    }>((resolve, reject) => {
      // Use python with -X utf8 for Windows Unicode support
      const pyProcess = spawn('python', ['-X', 'utf8', scriptPath, localPdfPath, uploadsDir, outputJsonPath], {
        windowsHide: true,
      });

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString('utf8');
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderrData += chunk.toString('utf8');
      });

      pyProcess.on('close', (code) => {
        // First check if output file was written
        if (fs.existsSync(outputJsonPath)) {
          try {
            const fileContent = fs.readFileSync(outputJsonPath, 'utf8');
            const parsed = JSON.parse(fileContent);
            fs.unlinkSync(outputJsonPath); // Clean up temp JSON
            return resolve(parsed);
          } catch (e) {
            // continue to stdout parsing
          }
        }

        if (code !== 0 && !stdoutData.trim()) {
          return resolve({
            success: false,
            error: stderrData || `Extractor process failed with code ${code}`,
          });
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch {
          resolve({
            success: false,
            error: stdoutData || stderrData || 'Failed to parse extraction output',
          });
        }
      });

      pyProcess.on('error', (err) => {
        resolve({
          success: false,
          error: `Failed to spawn Python process: ${err.message}. Ensure Python 3 is installed.`,
        });
      });
    });

    if (!extractionResult.success) {
      return NextResponse.json(
        {
          error: extractionResult.error || 'Failed to extract questions from PDF',
          pdfPath: storagePath,
          filename,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      pdfPath: storagePath,
      filename,
      totalPages: extractionResult.total_pages || 1,
      isScanned: !!extractionResult.is_scanned,
      questionsCount: extractionResult.questions?.length || 0,
      questions: extractionResult.questions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server extraction error' }, { status: 500 });
  }
}
