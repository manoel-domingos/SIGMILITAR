// components/meg/ProgressBar.tsx
'use client';

import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({ value, showText = true, size = 'md' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Determine progress bar colors based on value threshold
  let barColor = 'bg-rose-500 shadow-rose-500/20';
  let textColor = 'text-rose-600 dark:text-rose-400';
  let trackColor = 'bg-rose-100 dark:bg-rose-950/20';

  if (clampedValue >= 80) {
    barColor = 'bg-emerald-500 shadow-emerald-500/20';
    textColor = 'text-emerald-600 dark:text-emerald-400';
    trackColor = 'bg-emerald-100 dark:bg-emerald-950/20';
  } else if (clampedValue >= 50) {
    barColor = 'bg-amber-500 shadow-amber-500/20';
    textColor = 'text-amber-600 dark:text-amber-400';
    trackColor = 'bg-amber-100 dark:bg-amber-950/20';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full space-y-1.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        {showText && (
          <span className="text-slate-500 dark:text-slate-400">
            Conformidade MEG
          </span>
        )}
        <span className={`${textColor} font-bold font-mono`}>
          {Math.round(clampedValue)}%
        </span>
      </div>
      <div className={`w-full ${heightClasses[size]} ${trackColor} rounded-full overflow-hidden relative shadow-inner`}>
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out shadow-sm`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
