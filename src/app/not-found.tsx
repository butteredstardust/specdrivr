import Link from 'next/link';

/**
 * Global 404 Not Found page.
 *
 * This component is displayed when a user navigates to a route
 * that doesn't exist in the application.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary  flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="mb-6 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-[24px] font-semibold text-accent ">404</span>
          </div>
        </div>

        {/* Not Found Title */}
        <h1 className="text-[24px] font-semibold text-text-primary  mb-3">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-[13px] text-text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 text-[13px] text-white rounded-[8px]  transition-colors text-center"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/projects"
            className="px-6 py-3 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]  transition-colors text-center"
          >
            View Projects
          </Link>
        </div>

        {/* Suggestion */}
        <div className="mt-8 p-4 bg-bg-elevated border border-border-default rounded-[8px] bg-bg-elevated">
          <p className="text-[13px] font-medium text-text-secondary  flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Try checking the URL or use the navigation menu
          </p>
        </div>
      </div>
    </div>
  );
}
