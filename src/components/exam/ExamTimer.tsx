'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  startedAt: string;
  durationMinutes: number;
  onTimeExpired: () => void;
}

export function ExamTimer({ startedAt, durationMinutes, onTimeExpired }: ExamTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const started = new Date(startedAt).getTime();
    const totalSeconds = durationMinutes * 60;
    const elapsed = Math.floor((Date.now() - started) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const started = new Date(startedAt).getTime();
      const totalSeconds = durationMinutes * 60;
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onTimeExpired]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const totalDurationSeconds = durationMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / totalDurationSeconds) * 100));

  const isLowTime = secondsLeft < 300; // < 5 minutes
  const isUrgent = secondsLeft < 60; // < 1 minute

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all ${
        isUrgent
          ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
          : isLowTime
          ? 'bg-amber-50 border-amber-300 text-amber-800'
          : 'bg-indigo-50 border-indigo-200 text-indigo-900'
      }`}
    >
      {isLowTime ? (
        <AlertTriangle className="h-4 w-4 text-rose-600 animate-bounce" />
      ) : (
        <Clock className="h-4 w-4 text-indigo-600" />
      )}
      <div className="flex flex-col">
        <div className="flex items-center gap-1 font-mono font-bold text-sm">
          {hours > 0 && <span>{String(hours).padStart(2, '0')}:</span>}
          <span>{String(minutes).padStart(2, '0')}:</span>
          <span>{String(seconds).padStart(2, '0')}</span>
        </div>
        <div className="w-20 bg-slate-200 h-1 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full transition-all duration-1000 ${
              isLowTime ? 'bg-rose-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
