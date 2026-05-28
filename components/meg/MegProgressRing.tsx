// components/meg/MegProgressRing.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface MegProgressRingProps {
  value: number; // Current value (e.g. 850)
  max: number;   // Max value (e.g. 1000)
  size?: number; // Size in pixels
  strokeWidth?: number;
  title?: string;
  sub?: string;
}

export default function MegProgressRing({
  value,
  max,
  size = 220,
  strokeWidth = 16,
  title,
  sub
}: MegProgressRingProps) {
  const [offset, setOffset] = useState<number>(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    // Add a slight delay to trigger entry animation smoothly
    const timeout = setTimeout(() => {
      const progressOffset = circumference - (percentage / 100) * circumference;
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value, max, circumference, percentage]);

  // Determine gradient color scheme based on score percentage
  let gradientStart = '#f59e0b'; // Amber
  let gradientEnd = '#eab308';   // Yellow

  if (percentage >= 90) {
    gradientStart = '#10b981'; // Emerald
    gradientEnd = '#059669';
  } else if (percentage >= 70) {
    gradientStart = '#3b82f6'; // Blue
    gradientEnd = '#2563eb';
  } else if (percentage < 40) {
    gradientStart = '#ef4444'; // Red
    gradientEnd = '#dc2626';
  }

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      
      {/* Glow Effect behind the Ring */}
      <div 
        className="absolute w-[80%] h-[80%] rounded-full opacity-10 blur-2xl transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle, ${gradientStart} 0%, transparent 70%)`
        }}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
        
        {/* Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800/60"
        />

        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Central Content */}
      <div className="absolute flex flex-col items-center justify-center text-center px-4">
        {title ? (
          <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight leading-none">
            {title}
          </span>
        ) : (
          <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight leading-none">
            {value} <span className="text-xs text-slate-400 font-normal">/ {max}</span>
          </span>
        )}
        
        {sub && (
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
