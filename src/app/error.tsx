'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { PixelButton } from '@pxlkit/ui-kit';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    clientLogger.error('Page error', error);
  }, [error]);

  const errorMessage =
    process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base] p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[--status-red]/10 text-[--status-red]">
            <span className="text-2xl font-bold">!</span>
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[--text-primary]">Something went wrong</h1>
        <p className="mb-4 text-[--text-muted]">
          We apologize for the inconvenience. Please try again later.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 overflow-auto rounded-lg border bg-[--bg-surface] p-4">
            <p className="font-mono text-sm break-words whitespace-pre-wrap text-[--status-red]">
              {errorMessage}
            </p>
          </div>
        )}
        <div className="flex justify-center gap-2">
          <PixelButton onClick={reset} tone="purple" size="md">
            Try Again
          </PixelButton>
          <PixelButton onClick={() => window.location.reload()} tone="neutral" size="md">
            Reload Page
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
