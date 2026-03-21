'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ASCIIProgress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { clientLogger } from '@/lib/logger-client';

interface OnboardingWizardProps {
  user: {
    id: string;
    name: string;
    onboardingStep?: number;
  };
}

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectError, setProjectError] = useState<string | null>(null);

  async function handleSetName() {
    setNameError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        const msg = data.message ?? 'Failed to update display name.';
        setNameError(msg);
        clientLogger.error('OnboardingWizard: PATCH /api/v1/users/me failed', msg);
        return;
      }
      setStep(3);
    } catch (err) {
      const msg = 'An unexpected error occurred. Please try again.';
      setNameError(msg);
      clientLogger.error('OnboardingWizard: PATCH /api/v1/users/me exception', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateProject() {
    setProjectError(null);
    setIsSubmitting(true);
    try {
      const projectRes = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: projectName }),
      });
      if (!projectRes.ok) {
        const data = (await projectRes.json().catch(() => ({}))) as { message?: string };
        const msg = data.message ?? 'Failed to create project.';
        setProjectError(msg);
        clientLogger.error('OnboardingWizard: POST /api/v1/projects failed', msg);
        return;
      }

      const onboardingRes = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ onboardingStep: 3 }),
      });
      if (!onboardingRes.ok) {
        clientLogger.error('Failed to update onboarding step', { status: onboardingRes.status });
        setProjectError('Setup failed. Please try again.');
        return;
      }

      router.refresh();
    } catch (err) {
      const msg = 'An unexpected error occurred. Please try again.';
      setProjectError(msg);
      clientLogger.error('OnboardingWizard: handleCreateProject exception', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="border-border-default bg-bg-surface sm:max-w-md"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="text-text-muted font-mono text-[10px] tracking-[0.08em] uppercase">
            Setup Progress
          </div>
          <ASCIIProgress value={step - 1} max={3} length={20} className="text-accent-violet mb-4" />
        </div>

        {step === 1 && (
          <>
            <DialogHeader className="items-center text-center">
              <div className="mb-3 flex justify-center">
                <DaemonMascot size={64} expression="idle" />
              </div>
              <DialogTitle className="text-text-primary font-mono text-lg tracking-tight uppercase">
                Welcome to Specdrivr
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Let&apos;s get you set up in a few quick steps.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-center">
              <Button variant="violet" onClick={() => setStep(2)} className="w-full">
                Get Started
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-text-primary font-mono text-lg tracking-tight uppercase">
                Identify Yourself
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                This is how you&apos;ll appear to others on the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                disabled={isSubmitting}
                className="bg-bg-base border-border-default font-mono"
              />
              {!displayName.trim() && !nameError && (
                <p className="text-text-muted font-mono text-[10px] uppercase">
                  Name cannot be empty.
                </p>
              )}
              {nameError && (
                <p className="text-status-red font-mono text-[10px] uppercase">{nameError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="violet"
                onClick={handleSetName}
                disabled={isSubmitting || !displayName.trim()}
                className="w-full"
              >
                {isSubmitting ? 'Saving…' : 'Continue'}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-text-primary font-mono text-lg tracking-tight uppercase">
                Initialize Project
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Give your first project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                disabled={isSubmitting}
                className="bg-bg-base border-border-default font-mono"
              />
              {projectError && (
                <p className="text-status-red font-mono text-[10px] uppercase">{projectError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="violet"
                onClick={handleCreateProject}
                disabled={isSubmitting || !projectName.trim()}
                className="w-full"
              >
                {isSubmitting ? 'Creating…' : 'Create Project'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
