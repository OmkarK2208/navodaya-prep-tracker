import { NextResponse } from 'next/server';
import { getDataRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const repo = getDataRepository();
    const profiles = await repo.getProfiles();
    const students = profiles.filter((p) => p.role === 'student');

    let csvLines = [
      'Student Name,Email,Paper Title,Date Attempted,Status,Total Score,Max Marks,Percentage,Correct,Wrong,Unanswered,Accuracy %,Time Taken (mins)',
    ];

    for (const student of students) {
      const attempts = await repo.getStudentAttempts(student.id);
      for (const att of attempts) {
        const paperTitle = att.paper?.title ? `"${att.paper.title.replace(/"/g, '""')}"` : 'Unknown Paper';
        const dateStr = att.submitted_at || att.started_at;
        const minsTaken = (att.time_spent_seconds / 60).toFixed(1);

        csvLines.push(
          `"${student.full_name}","${student.email}",${paperTitle},"${dateStr}","${att.status}",${att.total_score || 0},${att.max_marks || 0},${att.percentage || 0}%,${att.correct_count || 0},${att.wrong_count || 0},${att.unanswered_count || 0},${att.accuracy_percentage || 0}%,${minsTaken}`
        );
      }
    }

    const csvContent = csvLines.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="navodaya_student_results_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'CSV export failed' }, { status: 500 });
  }
}
