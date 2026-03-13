'use client';
import { clientLogger } from '@/lib/logger-client';

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
        <div className="min-h-screen flex items-center justify-center bg-[--bg-base] p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--status-red]/10 text-[--status-red]">
                <span className="text-2xl font-bold">!</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[--text-primary] mb-2">Something went wrong</h1>
            <p className="text-[--text-muted] mb-4">We apologize for the inconvenience. Please try again later.</p>
            <div className="bg-[--bg-surface] rounded-lg border p-4">
              <p className="text-sm text-[--text-primary] break-words">{errorMessage}</p>
            </div>
            <div className="mt-6 flex gap-2 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
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

    return this.props.children;
  }
}

export { ErrorBoundary };
