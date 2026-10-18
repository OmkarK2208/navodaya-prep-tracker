'use client';

import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, X, ExternalLink, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface InteractiveQuestionImageProps {
  src: string;
  alt: string;
  questionNumber?: number;
  className?: string;
  maxHeightClass?: string;
}

export function InteractiveQuestionImage({
  src,
  alt,
  questionNumber,
  className = '',
  maxHeightClass = 'max-h-72 sm:max-h-80',
}: InteractiveQuestionImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset zoom & rotation when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
        if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.25, 3));
        if (e.key === '-') setScale((s) => Math.max(s - 0.25, 0.75));
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <>
      {/* Thumbnail / In-place Display */}
      <div
        className={`group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white p-2 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md cursor-zoom-in ${className}`}
        onClick={() => !hasError && setIsOpen(true)}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
            <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Hover / Tap Overlay Prompt */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ZoomIn className="h-3.5 w-3.5 text-indigo-300" />
          <span>Zoom / मोठे करा</span>
        </div>

        {/* Bottom Badge for MAT reasoning diagrams */}
        <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs">
          <ImageIcon className="h-3 w-3 text-indigo-600" />
          <span>High-Res Figure</span>
        </div>

        {hasError ? (
          <div className="p-8 text-center bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-rose-700">Image could not be loaded</p>
            <p className="text-[11px] text-slate-500 font-mono break-all">{src}</p>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={`w-full object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01] ${maxHeightClass}`}
          />
        )}
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          {/* Modal Top Control Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/80 border-b border-slate-800 text-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                {questionNumber ? `Q${questionNumber}` : '🔍'}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {questionNumber ? `Question ${questionNumber} Diagram (आकृती)` : 'Question Diagram'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Zoom: {Math.round(scale * 100)}% • Press Esc to close
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                title="Reset Zoom"
              >
                100%
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors"
                title="Open original image in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 ml-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Image Viewport */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl bg-white p-3 border border-slate-700 select-none pointer-events-auto"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
