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
import { Progress } from '@/components/ui/progress';
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
        className="sm:max-w-md"
      >
        <Progress value={((step - 1) / 3) * 100} className="mb-2" />

        {step === 1 && (
          <>
            <DialogHeader className="items-center text-center">
              <div className="mb-3 flex justify-center">
                <DaemonMascot size={64} expression="idle" />
              </div>
              <DialogTitle>Welcome to Specdrivr, {user.name}!</DialogTitle>
              <DialogDescription>Let&apos;s get you set up in a few quick steps.</DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex justify-center">
              <Button onClick={() => setStep(2)}>Get Started</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Set your display name</DialogTitle>
              <DialogDescription>
                This is how you&apos;ll appear to others on the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                disabled={isSubmitting}
              />
              {!displayName.trim() && !nameError && (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  Name cannot be empty.
                </p>
              )}
              {nameError && <p className="text-status-red mt-1 font-mono text-xs">{nameError}</p>}
            </div>
            <div className="mt-2 flex justify-end">
              <Button onClick={handleSetName} disabled={isSubmitting || !displayName.trim()}>
                {isSubmitting ? 'Saving…' : 'Continue'}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>Create your first project</DialogTitle>
              <DialogDescription>Give your first project a name to get started.</DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                disabled={isSubmitting}
              />
              {projectError && (
                <p className="text-status-red mt-1 font-mono text-xs">{projectError}</p>
              )}
            </div>
            <div className="mt-2 flex justify-end">
              <Button onClick={handleCreateProject} disabled={isSubmitting || !projectName.trim()}>
                {isSubmitting ? 'Creating…' : 'Create Project'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
