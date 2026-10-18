'use client';

import React, { useEffect, useRef } from 'react';

interface StudyTrackerProps {
  sessionType: 'exam' | 'solution_review' | 'revision' | 'practice';
  referenceId?: string | null;
}

export function StudyTracker({ sessionType, referenceId }: StudyTrackerProps) {
  const activeSecondsRef = useRef<number>(0);
  const isTabVisibleRef = useRef<boolean>(true);
  const lastUserActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // 1. Tab visibility handling
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Sensible non-invasive activity listeners (mouse move, key press, scroll)
    const handleActivity = () => {
      lastUserActivityRef.current = Date.now();
    };
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    // 3. Heartbeat ticker every second
    const interval = setInterval(() => {
      const now = Date.now();
      const isIdle = now - lastUserActivityRef.current > 120000; // 2 minutes idle threshold

      // Only increment active study time if tab is visible and student is not idle
      if (isTabVisibleRef.current && !isIdle) {
        activeSecondsRef.current += 1;
      }

      // Flush to server every 30 seconds
      if (activeSecondsRef.current >= 30) {
        const toSend = activeSecondsRef.current;
        activeSecondsRef.current = 0;

        fetch('/api/study/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionType,
            referenceId,
            activeSeconds: toSend,
          }),
        }).catch(() => {
          // If network failed, roll back seconds to retry on next tick
          activeSecondsRef.current += toSend;
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      // Send remaining seconds on unmount if any
      if (activeSecondsRef.current > 5) {
        navigator.sendBeacon?.(
          '/api/study/heartbeat',
          JSON.stringify({
            sessionType,
            referenceId,
            activeSeconds: activeSecondsRef.current,
          })
        );
      }
    };
  }, [sessionType, referenceId]);

  return null;
}

export function formatStudyTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 60) return `${totalSeconds || 0}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}
