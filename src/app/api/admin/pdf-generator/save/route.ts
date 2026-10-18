import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      pdfPath,
      durationMinutes,
      totalMarks,
      negativeMarking,
      isPublished,
      availableFrom,
      availableUntil,
      questions,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Test title is required' }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'At least 1 question is required' }, { status: 400 });
    }

    const repo = getDataRepository();
    const subjects = await repo.getSubjects();
    const matSub = subjects.find((s) => s.code === 'MAT');
    const mathSub = subjects.find((s) => s.code === 'MATH');
    const langSub = subjects.find((s) => s.code === 'LANG');

    // 1. Create the Paper in database
    const paper = await repo.createPaper({
      title: title.trim(),
      description: description || 'Extracted and verified from Navodaya Entrance PDF',
      pdf_path: pdfPath || null,
      duration_minutes: Number(durationMinutes) || 120,
      total_marks: Number(totalMarks) || questions.reduce((s: number, q: any) => s + (Number(q.marks) || 1.25), 0),
      negative_marking_per_question: Number(negativeMarking) || 0,
      is_published: !!isPublished,
      available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
      available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
      created_by: user.id,
    });

    // 2. Add each extracted and verified question
    for (const q of questions) {
      // Map subject code to real subject ID
      let subjectId = q.subject_id;
      if (!subjectId) {
        if (q.subject_code === 'MAT') subjectId = matSub?.id;
        else if (q.subject_code === 'MATH') subjectId = mathSub?.id;
        else if (q.subject_code === 'LANG') subjectId = langSub?.id;
        else subjectId = matSub?.id;
      }

      const options = (q.options || []).map((opt: any) => ({
        option_label: opt.option_label,
        option_text: opt.option_text || `Option ${opt.option_label}`,
        option_image_url: opt.option_image_url || undefined,
        // Only mark is_correct if admin explicitly verified and selected it!
        // Never invent or guess an unverified answer key!
        is_correct: !!opt.is_correct,
      }));

      await repo.addQuestion({
        paper_id: paper.id,
        subject_id: subjectId,
        topic_id: q.topic_id || undefined,
        question_number: Number(q.question_number),
        question_text: q.question_text || `Question ${q.question_number}`,
        question_image_url: q.question_image_url || undefined,
        marks: Number(q.marks) || 1.25,
        explanation: q.explanation || '',
        options,
      });
    }

    return NextResponse.json({
      success: true,
      paperId: paper.id,
      paper,
      questionsCount: questions.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save generated test' }, { status: 500 });
  }
}
