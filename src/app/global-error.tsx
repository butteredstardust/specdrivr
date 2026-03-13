'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const errorMessage =
    process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred';

  return (
    <html lang="en">
      <body>
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-4">
              <div className="bg-destructive/10 text-destructive inline-flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-2xl font-bold">!</span>
              </div>
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">Critical Error</h1>
            <p className="text-muted-foreground mb-4">
              The application encountered an unexpected error and needs to restart.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-card mb-4 overflow-auto rounded-lg border p-4">
                <p className="text-destructive font-mono text-sm break-words whitespace-pre-wrap">
                  {errorMessage}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <button
                onClick={reset}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
              >
                Try to Restore
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2"
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
