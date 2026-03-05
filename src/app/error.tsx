'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Global error boundary for the application.
 *
 * This component catches JavaScript errors in the component tree,
 * logs them, and displays a fallback UI.
 *
 * Props:
 * - error: The error object (contains message)
 * - reset: Function to reset the error boundary and re-render
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-600"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="ios-title-1 text-ios-text-primary ios-font-display mb-3">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="ios-body text-ios-text-secondary mb-6">
          {error.message || 'An unexpected error occurred. We apologize for the inconvenience.'}
        </p>

        {/* Error Digest (for debugging) */}
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="ios-caption text-ios-placeholder ios-font-text mb-6 font-mono bg-gray-100 p-2 rounded">
            Error ID: {error.digest}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 ios-body text-white ios-radius ios-font-text transition-colors"
            style={{ backgroundColor: 'var(--ios-blue)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Support Link */}
        {process.env.NODE_ENV === 'production' && (
          <p className="ios-caption text-ios-text-secondary ios-font-text mt-6">
            If this persists, please{' '}
            <a href="mailto:support@example.com" className="text-ios-blue hover:text-ios-blue-dark">
              contact support
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
