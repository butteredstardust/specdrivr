'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { Button } from '@/components/ui/button';

export function OnboardingRestartSection() {
  const [loading, setLoading] = useState(false);

  const handleRestart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ onboardingStep: 0 }),
      });
      if (!res.ok) {
        toast.error('Failed to restart tour.');
        return;
      }
      toast.success('Onboarding tour restarted.');
      window.location.reload();
    } catch (err) {
      clientLogger.error(
        'Onboarding restart error',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Failed to restart tour.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-line flex flex-col gap-3 rounded-md border p-4">
      <h2 className="text-fg-muted text-2xs font-medium">Onboarding</h2>
      <p className="text-fg-secondary text-sm">
        You can restart the onboarding tour to revisit the setup steps.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestart}
        disabled={loading}
        className="w-fit"
      >
        {loading ? 'Restarting…' : 'Restart Onboarding Tour'}
      </Button>
    </section>
  );
}
