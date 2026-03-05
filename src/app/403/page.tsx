import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-ios-red/10 flex items-center justify-center">
            <span className="ios-title-1 text-ios-red ios-font-display">403</span>
          </div>
        </div>
        
        <h1 className="ios-title-1 text-ios-text-primary ios-font-display mb-3">
          Access Forbidden
        </h1>
        
        <p className="ios-body text-ios-text-secondary mb-8">
          You don't have permission to access this resource.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/" 
            className="px-6 py-3 ios-body text-white ios-radius ios-font-text transition-colors text-center"
            style={{ backgroundColor: 'var(--ios-blue)' }}
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/projects" 
            className="px-6 py-3 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors text-center"
          >
            View Projects
          </Link>
        </div>
        
        <div className="mt-8 p-4 ios-card bg-ios-bg-card">
          <p className="ios-callout text-ios-text-secondary ios-font-text flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Contact an administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
}
