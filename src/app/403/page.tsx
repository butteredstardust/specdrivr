import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Error Code */}
        <div className="text-ios-red ios-font-display text-8xl font-bold mb-4">403</div>

        {/* Title */}
        <h1 className="ios-font-display text-4xl text-ios-text-primary mb-4">
          Access Denied
        </h1>

        {/* Message */}
        <p className="ios-body text-ios-text-secondary mb-8 leading-relaxed">
          You don't have permission to access this page. If you believe this is an error, please contact an administrator.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="ios-button-primary px-6 py-3 rounded-md text-ios-white inline-flex items-center justify-center gap-2 text-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="ios-white"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to Dashboard
          </Link>

          <Link
            href="/auth/login"
            className="ios-button-secondary px-6 py-3 rounded-md text-sm"
          >
            Sign in as different user
          </Link>
        </div>

        {/* Security Note */}
        <div className="mt-12 pt-6 border-t border-ios-border">
          <p className="ios-caption-1 text-ios-text-secondary">
            This event has been logged for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
