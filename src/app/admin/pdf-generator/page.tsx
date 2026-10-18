'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Layers,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  Check,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  BookOpen,
  Filter,
} from 'lucide-react';
import { InteractiveQuestionImage } from '@/components/exam/InteractiveQuestionImage';

interface ExtractedOption {
  option_label: 'A' | 'B' | 'C' | 'D';
  option_text: string;
  is_correct?: boolean;
  option_image_url?: string;
}

interface ExtractedQuestion {
  question_number: number;
  subject_code: string;
  subject_name: string;
  question_text: string;
  options: ExtractedOption[];
  question_image_url?: string | null;
  marks: number;
  explanation?: string;
  is_uncertain?: boolean;
  uncertainty_reason?: string | null;
  instructions?: string | null;
}

export default function PdfGeneratorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 'upload' | 'extracting' | 'review' | 'saved'
  const [step, setStep] = useState<'upload' | 'extracting' | 'review' | 'saved'>('upload');

  // File & Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'mar+eng' | 'mar' | 'eng'>('mar+eng');
  const [dragActive, setDragActive] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('Uploading PDF...');

  // Result & Editing state
  const [pdfPath, setPdfPath] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isScanned, setIsScanned] = useState<boolean>(false);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);

  // Paper Configuration
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [negativeMarking, setNegativeMarking] = useState<number>(0);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [availableUntil, setAvailableUntil] = useState<string>('');

  // UI / Filters
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | 'MAT' | 'MATH' | 'LANG' | 'UNCERTAIN'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [createdPaperId, setCreatedPaperId] = useState<string | null>(null);

  // Auto-calculate total marks
  const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 1.25), 0);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        setError('Please drop a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Load bundled sample papers for 1-click test
  const handleLoadSample = async (sampleType: 'marathi' | 'scanned') => {
    try {
      setError(null);
      setExtractionProgress('Fetching sample paper...');
      const url =
        sampleType === 'marathi'
          ? '/samples/navodaya_marathi_paper.pdf'
          : '/samples/navodaya_scanned_paper.pdf';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Sample paper file not found');
      const blob = await res.blob();
      const sampleFileName =
        sampleType === 'marathi'
          ? 'Navodaya_Marathi_Practice_Paper_2026.pdf'
          : 'Navodaya_Scanned_Entrance_Paper_2026.pdf';
      const file = new File([blob], sampleFileName, { type: 'application/pdf' });
      setSelectedFile(file);
      // Auto trigger extraction
      startExtraction(file);
    } catch (err: any) {
      setError(`Failed to load sample: ${err.message}`);
    }
  };

  // Trigger Extraction
  const startExtraction = async (fileToExtract?: File) => {
    const file = fileToExtract || selectedFile;
    if (!file) {
      setError('Please select or drop a PDF question paper file.');
      return;
    }

    setError(null);
    setStep('extracting');
    setExtractionProgress('Uploading PDF to server...');

    const timer1 = setTimeout(() => {
      setExtractionProgress('Analyzing layout, Devanagari text & mathematics...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setExtractionProgress('Cropping visual reasoning diagrams & parsing options (A, B, C, D)...');
    }, 3200);

    const timer3 = setTimeout(() => {
      setExtractionProgress('Formatting question bank & checking uncertainty flags...');
    }, 5500);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const res = await fetch('/api/admin/pdf-generator', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract questions from the PDF.');
      }

      setPdfPath(data.pdfPath);
      setFilename(data.filename);
      setIsScanned(!!data.isScanned);

      const extractedList: ExtractedQuestion[] = data.questions || [];
      setQuestions(extractedList);

      // Default Exam Title
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(rawName.length > 5 ? rawName : `Navodaya Practice Exam (${new Date().toLocaleDateString('en-IN')})`);
      setDescription(
        `Automated Navodaya Vidyalaya Class 6 exam paper generated from ${file.name}. Includes Mental Ability, Arithmetic, and Marathi Language sections.`
      );

      setStep('review');
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setError(err?.message || 'Error occurred during extraction.');
      setStep('upload');
    }
  };

  // Update question field
  const handleUpdateQuestion = (index: number, field: keyof ExtractedQuestion, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Set option as correct
  const handleSetCorrectOption = (qIndex: number, optionLabel: 'A' | 'B' | 'C' | 'D') => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIndex] };
      q.options = q.options.map((opt) => ({
        ...opt,
        is_correct: opt.option_label === optionLabel,
      }));
      updated[qIndex] = q;
      return updated;
    });
  };

  // Update option text
  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIndex] };
      const options = [...q.options];
      options[optIndex] = { ...options[optIndex], option_text: text };
      q.options = options;
      updated[qIndex] = q;
      return updated;
    });
  };

  // Delete question
  const handleDeleteQuestion = (qIndex: number) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    setQuestions((prev) => {
      const filtered = prev.filter((_, idx) => idx !== qIndex);
      // Renumber
      return filtered.map((q, idx) => ({ ...q, question_number: idx + 1 }));
    });
  };

  // Add new question manually
  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: ExtractedQuestion = {
      question_number: nextNum,
      subject_code: 'MAT',
      subject_name: 'Mental Ability',
      question_text: `नवीन प्रश्न क्रमांक ${nextNum}`,
      options: [
        { option_label: 'A', option_text: 'पर्याय (A)', is_correct: false },
        { option_label: 'B', option_text: 'पर्याय (B)', is_correct: false },
        { option_label: 'C', option_text: 'पर्याय (C)', is_correct: false },
        { option_label: 'D', option_text: 'पर्याय (D)', is_correct: false },
      ],
      marks: 1.25,
      explanation: '',
      is_uncertain: false,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  // Save / Publish
  const handleSavePaper = async (publishStatus: boolean) => {
    if (!title.trim()) {
      setError('Please provide an exam title.');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        pdfPath,
        durationMinutes: Number(durationMinutes) || 120,
        totalMarks: Number(totalMarks.toFixed(2)),
        negativeMarking: Number(negativeMarking) || 0,
        isPublished: publishStatus,
        availableFrom: availableFrom || null,
        availableUntil: availableUntil || null,
        questions,
      };

      const res = await fetch('/api/admin/pdf-generator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save paper and questions to database.');
      }

      setCreatedPaperId(data.paperId);
      setIsPublished(publishStatus);
      setStep('saved');
    } catch (err: any) {
      setError(err?.message || 'Failed to save test paper.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    if (subjectFilter === 'ALL') return true;
    if (subjectFilter === 'UNCERTAIN') return !!q.is_uncertain;
    return q.subject_code === subjectFilter;
  });

  const uncertainCount = questions.filter((q) => q.is_uncertain).length;
  const verifiedCount = questions.filter((q) => q.options.some((o) => o.is_correct)).length;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI & OCR Question Paper Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            PDF to Online Exam Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Instantly convert Marathi & English Navodaya entrance PDFs into interactive, timed, auto-graded online tests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/papers"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Papers</span>
          </Link>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-xl transition-colors ${
              step === 'upload' || step === 'extracting'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'upload' || step === 'extracting'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {step === 'review' || step === 'saved' ? <Check className="h-3.5 w-3.5" /> : '1'}
            </div>
            <span className="text-xs">1. Upload PDF Paper</span>
          </div>

          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-xl transition-colors ${
              step === 'review'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'review'
                  ? 'bg-indigo-600 text-white'
                  : step === 'saved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step === 'saved' ? <Check className="h-3.5 w-3.5" /> : '2'}
            </div>
            <span className="text-xs">2. Review & Answer Key</span>
          </div>

          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-xl transition-colors ${
              step === 'saved'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'saved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <span className="text-xs">3. Publish & Test</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Extraction or Processing Error: </span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Upload PDF */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white ${
              dragActive ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
              <Upload className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {selectedFile ? selectedFile.name : 'Choose or Drag & Drop Question Paper PDF'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Supports scanned and text-based Navodaya entrance question papers in Marathi, English, or bilingual format.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                Browse PDF Files
              </button>

              {selectedFile && (
                <button
                  type="button"
                  onClick={() => startExtraction()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Start Extraction</span>
                </button>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-slate-600 ml-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Quick Sample Papers for Instant Testing */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-indigo-100 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Try Instantly With Bundled Test Fixtures
              </h4>
            </div>
            <p className="text-xs text-slate-600 mb-4 max-w-2xl">
              Don&apos;t have a PDF ready on this computer right now? Load one of our verified real Navodaya exam test papers to experience the visual diagram cropper, Marathi Devanagari text parser, and interactive answer key matrix:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleLoadSample('marathi')}
                className="p-4 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-500 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm text-indigo-900 group-hover:text-indigo-600">
                    📄 Authentic Marathi Navodaya Paper
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    Text-Based PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Features Mental Ability with geometric diagrams, Arithmetic test questions, and Marathi reading passage (उतारा).
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample('scanned')}
                className="p-4 rounded-2xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm text-purple-900 group-hover:text-purple-600">
                    📑 Scanned & Image-Based Exam Paper
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                    Scanned OCR Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tests automated scan detection, OCR fallback, and uncertainty flagging for degraded print questions.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Extraction in Progress */}
      {step === 'extracting' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-75"></div>
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Analyzing Navodaya Question Paper</h3>
            <p className="text-xs text-indigo-600 font-semibold mt-2 animate-pulse">
              {extractionProgress}
            </p>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-200/60 max-w-md mx-auto">
            Processing Devanagari Unicode, detecting questions, parsing answer options (A, B, C, D), and cropping visual diagrams into web assets.
          </div>
        </div>
      )}

      {/* STEP 3: Review, Edit & Answer Key Matrix */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Top Paper Configuration Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Test Paper Configuration
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isScanned ? (
                  <span className="px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    📷 Scanned PDF Mode
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ⚡ High Accuracy Digital PDF
                  </span>
                )}
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-600">{questions.length} Questions</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Navodaya Entrance Mock Test 12"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short note or instructions for the student"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={totalMarks.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Negative Mark / Q
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="2"
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exam Status
                </label>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    isPublished
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Publish Instantly</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Save as Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Answer Key Verification Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Rapid Answer Key Verification Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click the correct option (A, B, C, D) for each question. Answers are never guessed automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  Verified: {verifiedCount} / {questions.length}
                </span>
                {uncertainCount > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>{uncertainCount} Review Needed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Matrix Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {questions.map((q, qIdx) => {
                const currentCorrect = q.options.find((o) => o.is_correct)?.option_label;
                return (
                  <div
                    key={q.question_number}
                    className={`p-2 rounded-xl border text-center transition-all bg-white ${
                      currentCorrect
                        ? 'border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                        : q.is_uncertain
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1 px-1">
                      <span>Q{q.question_number}</span>
                      {currentCorrect ? (
                        <span className="text-[10px] text-emerald-600 font-extrabold">✓ {currentCorrect}</span>
                      ) : (
                        <span className="text-[10px] text-rose-500">Unset</span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['A', 'B', 'C', 'D'] as const).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => handleSetCorrectOption(qIdx, lbl)}
                          className={`text-[11px] font-bold py-1 rounded-md transition-all ${
                            currentCorrect === lbl
                              ? 'bg-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Questions Filter & Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSubjectFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  subjectFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Questions ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setSubjectFilter('MAT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  subjectFilter === 'MAT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Mental Ability ({questions.filter((q) => q.subject_code === 'MAT').length})
              </button>
              <button
                type="button"
                onClick={() => setSubjectFilter('MATH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  subjectFilter === 'MATH'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Arithmetic ({questions.filter((q) => q.subject_code === 'MATH').length})
              </button>
              <button
                type="button"
                onClick={() => setSubjectFilter('LANG')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  subjectFilter === 'LANG'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Marathi Language ({questions.filter((q) => q.subject_code === 'LANG').length})
              </button>
              {uncertainCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSubjectFilter('UNCERTAIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    subjectFilter === 'UNCERTAIN'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  ⚠️ Needs Review ({uncertainCount})
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Quick Jump Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Quick Jump Matrix ({questions.length} Questions)</span>
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Has Image (
                  {questions.filter((q) => q.question_image_url).length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Answer Key Set (
                  {questions.filter((q) => q.options.some((o) => o.is_correct)).length})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
              {questions.map((q) => {
                const hasImg = !!q.question_image_url;
                const hasKey = q.options.some((o) => o.is_correct);
                const isUnc = !!q.is_uncertain;

                return (
                  <button
                    key={q.question_number}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`q-card-${q.question_number}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`h-7 w-7 rounded-lg text-[11px] font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                      isUnc
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : hasImg
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white'
                        : hasKey
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title={`Jump to Q${q.question_number} ${hasImg ? '(Visual Diagram)' : ''}`}
                  >
                    {q.question_number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const originalIndex = questions.findIndex(
                (item) => item.question_number === q.question_number
              );
              const isUncertain = !!q.is_uncertain;

              return (
                <div
                  key={q.question_number}
                  id={`q-card-${q.question_number}`}
                  className={`bg-white rounded-3xl border p-6 shadow-xs space-y-4 transition-all ${
                    isUncertain ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">
                        {q.question_number}
                      </span>
                      <select
                        value={q.subject_code}
                        onChange={(e) => {
                          const code = e.target.value;
                          const name =
                            code === 'MAT'
                              ? 'Mental Ability'
                              : code === 'MATH'
                              ? 'Arithmetic'
                              : 'Language (Marathi)';
                          handleUpdateQuestion(originalIndex, 'subject_code', code);
                          handleUpdateQuestion(originalIndex, 'subject_name', name);
                        }}
                        className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <option value="MAT">🧠 Mental Ability (MAT)</option>
                        <option value="MATH">🔢 Arithmetic (गणित)</option>
                        <option value="LANG">📖 Language (मराठी)</option>
                      </select>

                      {isUncertain && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          <span>Review Recommended</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 font-semibold">Marks:</span>
                        <input
                          type="number"
                          step="0.25"
                          value={q.marks}
                          onChange={(e) =>
                            handleUpdateQuestion(originalIndex, 'marks', Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(originalIndex)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Uncertainty reason notice */}
                  {isUncertain && q.uncertainty_reason && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{q.uncertainty_reason}</span>
                    </div>
                  )}

                  {/* Section / Passage instructions if present */}
                  {q.instructions && (
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 font-medium whitespace-pre-wrap">
                      <span className="font-bold block mb-0.5">सूचना / Passage Instructions:</span>
                      {q.instructions}
                    </div>
                  )}

                  {/* Diagram / Reasoning Image */}
                  {q.question_image_url && (
                    <div className="my-2">
                      <InteractiveQuestionImage
                        src={q.question_image_url}
                        alt={`Question ${q.question_number} diagram`}
                        questionNumber={q.question_number}
                        maxHeightClass="max-h-72"
                      />
                    </div>
                  )}

                  {/* Question Text Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Question Text (Marathi / English)
                    </label>
                    <textarea
                      rows={2}
                      value={q.question_text}
                      onChange={(e) =>
                        handleUpdateQuestion(originalIndex, 'question_text', e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Options List (A, B, C, D) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Options & Correct Answer Key (Choose one):
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = !!opt.is_correct;
                        return (
                          <div
                            key={opt.option_label}
                            onClick={() => handleSetCorrectOption(originalIndex, opt.option_label)}
                            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <button
                              type="button"
                              className={`h-7 w-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {opt.option_label}
                            </button>

                            <input
                              type="text"
                              value={opt.option_text}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleUpdateOptionText(originalIndex, optIdx, e.target.value)
                              }
                              className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-slate-900 focus:outline-none px-1"
                              placeholder={`Option ${opt.option_label}`}
                            />

                            {isCorrect && (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                                Correct ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation / Solution */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Step-by-step Solution / Marathi Explanation (Shown to student after submission)
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(originalIndex, 'explanation', e.target.value)
                      }
                      placeholder="e.g. आकृती (B) मध्ये इतर आकृत्यांपेक्षा वेगळा घटक दिसतो..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Discard changes and upload another PDF?')) {
                    setStep('upload');
                    setSelectedFile(null);
                  }
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
              >
                Discard & Upload Another
              </button>

              <span className="text-xs text-slate-500 hidden sm:inline">
                {verifiedCount} of {questions.length} questions have verified answers
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSavePaper(false)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSavePaper(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Publish Test Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Success State */}
      {step === 'saved' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Exam Paper Successfully Generated!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              &quot;{title}&quot; is now saved in the database with {questions.length} structured questions, options, and diagrams.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-bold text-slate-800">{durationMinutes} Minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Marks:</span>
              <span className="font-bold text-slate-800">{totalMarks.toFixed(2)} Marks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verified Answer Keys:</span>
              <span className="font-bold text-emerald-600">{verifiedCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Publication Status:</span>
              <span className="font-bold text-indigo-600">
                {isPublished ? 'Published (Ready for Sister)' : 'Draft (Admin Only)'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {createdPaperId && (
              <>
                <Link
                  href={`/student/exam/${createdPaperId}/instructions`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
                >
                  <Eye className="h-4 w-4" />
                  <span>Take Exam as Student</span>
                </Link>

                <Link
                  href={`/admin/papers/${createdPaperId}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all"
                >
                  View Paper Details
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setSelectedFile(null);
                setQuestions([]);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Upload Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
