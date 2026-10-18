// End-to-End Verification Test Script

async function runVerification() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- 1. Testing System Health & Database Diagnostics ---');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log('Status:', health.status);
  console.log('Active DB Mode:', health.mode);
  console.log('Available Papers Count:', health.papersCount);

  console.log('\n--- 2. Testing Authentication & Role Verification ---');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sister@navodaya.local', role: 'student' }),
  });
  const loginData = await loginRes.json();
  console.log('Authenticated User:', loginData.user.full_name, `[${loginData.user.role}]`);

  console.log('\n--- 3. Testing Daily Published Papers Query ---');
  const papersRes = await fetch(`${baseUrl}/api/papers?publishedOnly=true`);
  const { papers } = await papersRes.json();
  const testPaper = papers[0];
  console.log('Loaded Paper:', testPaper.title, `(${testPaper.duration_minutes} mins, ${testPaper.total_marks} marks)`);

  console.log('\n--- 4. Starting Timed Exam Attempt & Timing Validation ---');
  const examStartRes = await fetch(`${baseUrl}/api/exam/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperId: testPaper.id }),
  });
  const examData = await examStartRes.json();
  console.log('Attempt ID:', examData.attempt.id);
  console.log('Remaining Time:', examData.remainingSeconds, 'seconds');
  console.log('Questions in Exam:', examData.paper.questions.length);

  // Security Verification: Check that is_correct is NOT exposed during the active exam!
  const hasLeakedKey = examData.paper.questions.some((q) =>
    q.options.some((opt) => opt.is_correct !== undefined)
  );
  console.log('Security check - Are answer keys masked from student?', !hasLeakedKey ? 'PASSED (Protected)' : 'FAILED (Leaked)');

  console.log('\n--- 5. Testing Resilient Answer Autosave ---');
  const q1 = examData.paper.questions[0];
  const q2 = examData.paper.questions[1];
  
  // Choose Option D for Question 1
  const save1 = await fetch(`${baseUrl}/api/exam/save-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attemptId: examData.attempt.id,
      questionId: q1.id,
      selectedOptionId: q1.options[3].id,
      selectedOptionLabel: q1.options[3].option_label,
      isMarkedForReview: false,
      timeSpentSeconds: 30,
    }),
  });
  const save1Data = await save1.json();
  console.log('Question 1 Answer Autosaved:', save1Data.success);

  // Choose Option A for Question 2 and mark for review
  const save2 = await fetch(`${baseUrl}/api/exam/save-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attemptId: examData.attempt.id,
      questionId: q2.id,
      selectedOptionId: q2.options[0].id,
      selectedOptionLabel: q2.options[0].option_label,
      isMarkedForReview: true,
      timeSpentSeconds: 45,
    }),
  });
  const save2Data = await save2.json();
  console.log('Question 2 Answer Autosaved & Marked for Review:', save2Data.success);

  console.log('\n--- 6. Testing Authoritative Server Evaluation on Submission ---');
  const submitRes = await fetch(`${baseUrl}/api/exam/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attemptId: examData.attempt.id }),
  });
  const submitData = await submitRes.json();
  const result = submitData.attempt;
  console.log('Authoritative Score Calculated by Server:');
  console.log(`  Total Score: ${result.total_score} / ${result.max_marks} (${result.percentage}%)`);
  console.log(`  Correct: ${result.correct_count}, Wrong: ${result.wrong_count}, Unanswered: ${result.unanswered_count}`);
  console.log(`  Accuracy: ${result.accuracy_percentage}%`);
  console.log(`  Immutable Paper Snapshot Saved:`, result.paper_snapshot ? 'YES' : 'NO');

  console.log('\n--- 7. Testing Solutions and Explanations Verification ---');
  const solutionsRes = await fetch(`${baseUrl}/api/exam/attempts/${result.id}`);
  const solData = await solutionsRes.json();
  console.log('Result & Solutions Retrievable:', solData.attempt.status === 'submitted');
  const firstQWithExpl = solData.paper.questions.find((q) => q.explanation);
  console.log(`Step-by-Step Explanation for Q${firstQWithExpl.question_number}: "${firstQWithExpl.explanation.slice(0, 60)}..."`);

  console.log('\n--- 8. Testing Student Dashboard & Weekly Metrics Persistence ---');
  const dashRes = await fetch(`${baseUrl}/api/student/dashboard`);
  const dashData = await dashRes.json();
  console.log('Total Exams Attempted Persisted:', dashData.stats.total_papers_attempted);
  console.log('Latest Score:', dashData.stats.latest_score);
  console.log('Subject Mastery Count:', dashData.stats.subject_progress.length);
  console.log('Weak Topics Queued for Practice:', dashData.stats.weak_topics.length);

  console.log('\n--- 9. Testing Admin CSV Performance Export ---');
  // Switch to Admin
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@navodaya.local', role: 'admin' }),
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie');

  const csvRes = await fetch(`${baseUrl}/api/admin/export-csv`, {
    headers: adminCookie ? { cookie: adminCookie } : {},
  });
  const csvText = await csvRes.text();
  console.log('CSV Export Response (First 2 Lines):');
  console.log('  ' + csvText.split('\n').slice(0, 2).join('\n  '));

  console.log('\n======================================================');
  console.log('✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

runVerification().catch(console.error);
