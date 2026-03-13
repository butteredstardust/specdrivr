'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/logger-client';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    clientLogger.error('Page error', error);
  }, [error]);

  const errorMessage = process.env.NODE_ENV === 'development'
    ? error.message
    : 'Something went wrong';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--bg-base] p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--status-red]/10 text-[--status-red]">
            <span className="text-2xl font-bold">!</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[--text-primary] mb-2">Something went wrong</h1>
        <p className="text-[--text-muted] mb-4">
          We apologize for the inconvenience. Please try again later.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 bg-[--bg-surface] rounded-lg border p-4 overflow-auto">
            <p className="text-sm text-[--status-red] font-mono whitespace-pre-wrap break-words">
              {errorMessage}
            </p>
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
