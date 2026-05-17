'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[v0-Error-Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong!</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button 
          onClick={() => reset()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

