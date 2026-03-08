'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const errorMessage = process.env.NODE_ENV === 'development'
    ? error.message
    : 'An unexpected error occurred';

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
                <span className="text-2xl font-bold">!</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Critical Error</h1>
            <p className="text-muted-foreground mb-4">
              The application encountered an unexpected error and needs to restart.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 bg-card rounded-lg border p-4 overflow-auto">
                <p className="text-sm text-destructive font-mono whitespace-pre-wrap break-words">
                  {errorMessage}
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try to Restore
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
