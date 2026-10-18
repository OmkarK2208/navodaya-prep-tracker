# 🎓 Navodaya Prep Tracker (JNVST Selection Suite)

A complete, production-ready full-stack web application designed for Jawahar Navodaya Vidyalaya (JNVST Class 6 & 9) entrance exam preparation. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL / Storage**.

---

## 🌟 Key Features

### 1. 🛡️ Administrator & Mentor Portal (For You)
- **Daily Paper Management:** Create daily mock papers, specify custom durations, total marks, and negative marking rules.
- **PDF Question Paper Upload:** Attach official question paper PDFs to private cloud storage.
- **Interactive Question & Answer-Key Editor:**
  - Create single-correct Multiple Choice Questions (A, B, C, D).
  - Categorize by official syllabus sections: **Mental Ability Test (MAT)**, **Arithmetic (Math)**, and **Language (Comprehension)**.
  - Set correct answer keys and age-appropriate step-by-step explanations.
  - Preview papers before publishing.
  - Duplicate previous papers with 1 click.
- **Paper Scheduling:** Configure start/end availability windows or save drafts until ready.
- **Student Monitoring & CSV Export:** Real-time view of sister's completed tests, scores, time spent, and 1-click CSV export.

### 2. 👧 Student Examination Portal (For Your Sister)
- **Kid-Friendly Educational Dashboard:**
  - Today's assigned paper with a prominent "Start Exam" card.
  - Exam streak counter (🔥 days in a row) to build consistent study habits.
  - Overall accuracy, questions solved, latest score, best score, and study time today.
  - Subject-wise progress cards for Mental Ability, Arithmetic, and Language.
  - Auto-detected **Weak Topics** needing revision.
  - Weekly performance trends chart.
- **Realistic Timed Examination Engine:**
  - **Authoritative Server Timer:** Countdown timer based on persisted start time and configured duration (cannot be cheated by refreshing the browser!).
  - **Question Navigation Palette:** Jump between questions with color-coded status (Answered: Green, Review: Purple, Unanswered: Gray).
  - **Resilient Autosave:** Answers are saved automatically with debouncing and instant visual feedback (Saved / Saving).
  - **Pre-submission Confirmation Dialog:** Warns the student if unanswered questions remain before final submission.
  - **Auto-Submission on Time Expiry:** Automatically submits the exam when the timer reaches 0:00.
  - **Answer Key Protection:** Correct answers are strictly masked on the server until the exam is submitted!
- **Detailed Result & Wrong Answer Solutions:**
  - Instant server-side evaluation with total score, percentage, correct/wrong count, and subject breakdown.
  - **Step-by-Step Solutions:** Full explanations for all incorrect or unanswered questions.
  - **Interactive Practice Retry:** Sister can retry missed questions directly on the solutions page!
  - **Targeted Weak Topics Queue:** Missed questions automatically queue into a revision list where she can mark them as mastered once understood.

---

## 🚀 Quick Start Guide (Windows)

### 1. Clone & Navigate to the Project Folder
Open your terminal in `C:\Users\SHREE\.gemini\antigravity\scratch\navodaya-prep-tracker`:
```powershell
cd C:\Users\SHREE\.gemini\antigravity\scratch\navodaya-prep-tracker
```

### 2. Start the Application
To run the production build:
```powershell
npm start
```
Or for local hot-reloading development:
```powershell
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Login & Role Switching

The app includes two pre-configured accounts:
- **Student View (Sister):** `sister@navodaya.local` / `student123`
- **Admin View (Mentor):** `admin@navodaya.local` / `admin123`

> **Tip:** You can also use the **Role Switcher button** in the top navigation bar at any time to instantly switch between Admin View and Student View for testing!

---

## ☁️ Connecting Your Live Supabase Database

The application is pre-configured with a **Dual-Mode Data Engine**:
- **Offline / Local Mode (Default):** Runs immediately with durable file persistence (`data/navodaya-data.json`), pre-seeded with the official JNVST Class 6 syllabus and starter practice paper.
- **Cloud Mode (Supabase PostgreSQL):** Seamlessly connects when valid Supabase credentials are provided in `.env.local`.

### Easy Steps to Connect Supabase:

1. **Create a Free Project:**
   Go to [supabase.com](https://supabase.com) and create a new project.

2. **Run the Database Migration:**
   - In your Supabase dashboard, open the **SQL Editor** tab on the left menu.
   - Open the file [`supabase/migrations/20261018000000_navodaya_schema.sql`](file:///C:/Users/SHREE/.gemini/antigravity/scratch/navodaya-prep-tracker/supabase/migrations/20261018000000_navodaya_schema.sql).
   - Copy the entire SQL script, paste it into the Supabase SQL Editor, and click **Run**.
   - (Optional) Paste and run [`supabase/seed.sql`](file:///C:/Users/SHREE/.gemini/antigravity/scratch/navodaya-prep-tracker/supabase/seed.sql) to seed default subjects and topics.

3. **Get Your API Keys:**
   - In Supabase, go to **Project Settings** -> **API**.
   - Copy the **Project URL**, the **Anon Key**, and the **service_role Key** (under Project API keys).

4. **Update `.env.local`:**
   Open `.env.local` and paste your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata
   NEXT_PUBLIC_STORAGE_BUCKET=exam-papers
   ```

5. **Restart the App:**
   Restart Next.js (`npm run build` then `npm start`). The top banner will immediately turn green:
   `🟢 Connected to Supabase PostgreSQL (Cloud Active)`.

---

## 🧪 Running Automated Tests

All tests run locally using Vitest:

```powershell
# Run all unit tests
npm test

# Run the complete live End-to-End lifecycle verification script
node scripts/test-e2e.mjs
```

### Verified Test Suite:
- `scoring.test.ts`: Negative marking, percentage calculation, and immutable snapshots.
- `repository.test.ts`: Paper CRUD, question authoring, duplicate cloning, answer autosave, and revision tracking.
- `config.test.ts`: Supabase credential and environment validation.
- `test-e2e.mjs`: Complete real-time browser-equivalent flow (Login -> Start Exam -> Autosave -> Submit -> Solutions -> Dashboard -> Admin CSV Export).

---

## 📁 Project Structure

```
navodaya-prep-tracker/
├── src/
│   ├── app/
│   │   ├── admin/                # Admin management dashboard, papers list, questions editor
│   │   ├── student/              # Student dashboard, daily papers, reports, weak revision
│   │   ├── student/exam/         # Timed examination engine with countdown and autosave
│   │   ├── student/results/      # Score evaluation and wrong-answer solutions
│   │   ├── api/                  # Server-authoritative REST APIs & secure endpoints
│   │   ├── layout.tsx            # Root layout with responsive Navbar and DB status badge
│   │   └── page.tsx              # Welcome overview page
│   ├── components/
│   │   ├── exam/                 # ExamTimer, QuestionPalette, SubmitModal
│   │   ├── study/                # Non-invasive StudyTracker with idle capping
│   │   ├── Navbar.tsx            # Navigation bar with 1-click role switcher
│   │   └── DatabaseStatusBanner.tsx # Visual indicator for database connection state
│   ├── lib/
│   │   ├── db/                   # Dual-mode repository (Supabase PostgreSQL + Local JSON)
│   │   ├── auth/                 # Server-side auth, cookies, and role guards
│   │   ├── supabase/             # Browser, server, and admin Supabase clients
│   │   └── scoring.ts            # Server-authoritative evaluation engine
│   └── types/
│       └── database.ts           # TypeScript interfaces matching PostgreSQL schema
├── supabase/
│   ├── migrations/               # PostgreSQL schema & Row Level Security (RLS) policies
│   └── seed.sql                  # Seed data for Navodaya subjects and topics
├── scripts/
│   └── test-e2e.mjs              # End-to-end verification script
└── data/
    └── navodaya-data.json        # Persistent local storage (auto-seeded)
```

---

## 🌐 Deploying to Vercel

The application is fully compatible with Vercel:
1. Push this project folder to your GitHub repository.
2. In Vercel, click **Add New Project** and import the repository.
3. In the **Environment Variables** section, add your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata`.
4. Click **Deploy**. Vercel will build and host your application with global edge speed!
