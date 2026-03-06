'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

/**
 * Global error boundary for the application.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-[var(--sp-4)]">
      <div className="text-center max-w-md">
        <div className="mb-[var(--sp-6)] flex justify-center">
          <div className="w-[80px] h-[80px] rounded-full bg-[var(--status-blocked-bg)] flex items-center justify-center">
            <XCircle size={32} className="text-[var(--status-blocked-text)]" />
          </div>
        </div>

        <h1 className="text-[var(--font-size-xl)] font-semibold text-[var(--text-primary)] mb-[var(--sp-3)]">
          Something went wrong
        </h1>

        <p className="text-[var(--font-size-sm)] text-[var(--text-secondary)] mb-[var(--sp-6)]">
          {error.message || 'An unexpected error occurred. We apologize for the inconvenience.'}
        </p>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] mb-[var(--sp-6)] font-mono bg-[var(--bg-sunken)] p-[var(--sp-2)] rounded-[var(--radius-sm)]">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-[var(--sp-3)] justify-center">
          <button
            onClick={reset}
            className="px-[var(--sp-6)] py-[var(--sp-3)] text-[var(--font-size-sm)] text-white bg-[var(--brand-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors font-medium"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-[var(--sp-6)] py-[var(--sp-3)] text-[var(--font-size-sm)] text-[var(--brand-primary)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-hovered)] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {process.env.NODE_ENV === 'production' && (
          <p className="text-[var(--font-size-xs)] text-[var(--text-secondary)] mt-[var(--sp-6)]">
            If this persists, please{' '}
            <a href="mailto:support@example.com" className="text-[var(--brand-primary)] hover:underline">
              contact support
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
