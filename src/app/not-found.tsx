import Link from 'next/link';
import { Search } from 'lucide-react';

/**
 * Global 404 Not Found page.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] flex items-center justify-center p-[var(--sp-4)]">
      <div className="text-center max-w-md">
        <div className="mb-[var(--sp-6)] flex justify-center">
          <div className="w-[80px] h-[80px] rounded-full bg-[var(--color-bg-sunken)] flex items-center justify-center">
            <Search size={32} className="text-[var(--color-text-tertiary)]" />
          </div>
        </div>

        <h1 className="text-[var(--font-size-xl)] font-semibold text-[var(--color-text-primary)] mb-[var(--sp-3)]">
          Page not found
        </h1>

        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-[var(--sp-8)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-[var(--sp-3)] justify-center">
          <Link
            href="/"
            className="px-[var(--sp-6)] py-[var(--sp-3)] text-[var(--font-size-sm)] text-white bg-[var(--color-brand-bold)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors text-center font-medium"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-[var(--sp-8)] p-[var(--sp-4)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
          <p className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-secondary)] flex items-center justify-center gap-[var(--sp-2)]">
            Try checking the URL or use the navigation menu
          </p>
        </div>
      </div>
    </div>
  );
}
