'use client';
import { clientLogger } from '@/lib/logger-client';
import { PixelButton } from '@pxlkit/ui-kit';

import React, { Component, type ReactNode } from 'react';
import type { ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    clientLogger.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Something went wrong';

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
            <div className="rounded-lg border bg-[--bg-surface] p-4">
              <p className="text-sm break-words text-[--text-primary]">{errorMessage}</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <PixelButton
                onClick={() => this.setState({ hasError: false, error: undefined })}
                tone="purple"
                size="md"
              >
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

    return this.props.children;
  }
}

export { ErrorBoundary };
