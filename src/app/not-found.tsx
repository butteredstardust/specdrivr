'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/ui/brand-mark';

export default function NotFound() {
  return (
    <div className="bg-surface-base flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <BrandMark size={64} />
      </div>
      <h1 className="text-fg mb-2 font-mono text-4xl font-bold tracking-tighter">
        404: SEGMENT_NOT_FOUND
      </h1>
      <p className="text-fg-muted mb-8 max-w-md font-mono text-sm">
        The requested path does not exist in the current specification. The system has encountered a
        non-recoverable routing error.
      </p>
      <Button asChild variant="outline" className="border-line hover:bg-surface-inset">
        <Link href="/">Return to Mission Control</Link>
      </Button>
    </div>
  );
}
