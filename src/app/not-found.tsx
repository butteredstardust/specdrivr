'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

export default function NotFound() {
  return (
    <div className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <DaemonMascot size={64} expression="idle" />
      </div>
      <h1 className="text-text-primary mb-2 font-mono text-4xl font-bold tracking-tighter">
        404: SEGMENT_NOT_FOUND
      </h1>
      <p className="text-text-muted mb-8 max-w-md font-mono text-sm">
        The requested path does not exist in the current specification. The system has encountered a
        non-recoverable routing error.
      </p>
      <Button asChild variant="outline" className="border-border-default hover:bg-bg-elevated">
        <Link href="/">Return to Mission Control</Link>
      </Button>
    </div>
  );
}
