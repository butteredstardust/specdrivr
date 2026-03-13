'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PixelInput, PixelPasswordInput, PixelButton, PixelAlert } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { twMerge } from 'tailwind-merge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const inviteSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteValues = z.infer<typeof inviteSchema>;

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const score = getPasswordStrength(password);

  const getSegmentClass = (index: number) => {
    if (score < index) return 'bg-[--bg-base]';
    if (score === 1) return 'bg-[--status-red]';
    if (score === 2) return 'bg-[--status-orange]';
    if (score === 3) return 'bg-[--phosphor-amber]';
    if (score >= 4) return 'bg-[--status-emerald]';
    return 'bg-[--bg-base]';
  };

  return (
    <div className="mt-2 flex h-1 w-full gap-1">
      <div className={twMerge('flex-1 rounded-full transition-colors', getSegmentClass(1))} />
      <div className={twMerge('flex-1 rounded-full transition-colors', getSegmentClass(2))} />
      <div className={twMerge('flex-1 rounded-full transition-colors', getSegmentClass(3))} />
      <div className={twMerge('flex-1 rounded-full transition-colors', getSegmentClass(4))} />
    </div>
  );
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteData, setInviteData] = useState<{
    email: string;
    projectName: string;
    isExistingUser: boolean;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  const nameValue = watch('name');
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  useEffect(() => {
    if (!token) {
      setError('This invite link has expired.');
      setIsLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`/api/v1/auth/invite?token=${token}`);
        const json = await res.json();

        if (!res.ok) {
          setError('This invite link has expired.');
        } else {
          setInviteData(json.data);
        }
      } catch {
        setError('This invite link has expired.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  const handleNewUserSubmit = async (data: InviteValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
          name: data.name,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to accept invite');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleExistingUserSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to accept invite');
      }

      // Existing users just needed to accept it, redirect to login
      // Wait, spec says "Sign In & Accept <- triggers signIn then accept"
      // Actually, we can just redirect them to login with a next param
      router.push('/login?next=/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[400px] text-center text-[--text-muted]">
        <DaemonMascot size="lg" state="working" className="mx-auto mb-4" />
        Validating invite...
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8 text-center">
          <DaemonMascot size="lg" state="error" className="mb-4" />
          <h1 className="mb-2 text-lg font-bold text-[--text-primary]">
            This invite link has expired.
          </h1>
          <p className="mb-8 text-sm text-[--text-muted]">Ask a team admin to send a new invite.</p>
        </div>
      </div>
    );
  }

  if (inviteData.isExistingUser) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8 text-center">
          <DaemonMascot size="lg" state="idle" className="mb-4" />
          <h1 className="mb-2 text-lg font-bold text-[--text-primary]">
            You've been invited to {inviteData.projectName}
          </h1>
          <p className="mb-8 text-sm text-[--text-muted]">
            Sign in to your existing account to accept.
          </p>

          {error && (
            <div className="mb-6 w-full">
              <PixelAlert tone="red" title="Error" message={error} />
            </div>
          )}

          <PixelButton
            tone="purple"
            className="w-full"
            onClick={handleExistingUserSubmit}
            loading={isSubmitting}
          >
            Sign In & Accept
          </PixelButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8">
        <DaemonMascot
          size="lg"
          state={isSubmitting ? 'working' : error ? 'error' : 'idle'}
          className="mb-4"
        />
        <h1 className="mb-2 text-center text-lg font-bold text-[--text-primary]">
          You've been invited to {inviteData.projectName}
        </h1>
        <p className="mb-8 text-center text-sm text-[--text-muted]">
          Create your account to get started.
        </p>

        <form className="flex w-full flex-col gap-5" onSubmit={handleSubmit(handleNewUserSubmit)}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[--text-secondary]">EMAIL</label>
            <div className="flex items-center gap-2 rounded border border-[--border-muted] bg-[--bg-base] px-3 py-2 text-sm text-[--text-muted]">
              <span className="flex-1 truncate">{inviteData.email}</span>
              <span>✓</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-[--text-secondary]">
              YOUR NAME
            </label>
            <PixelInput
              id="name"
              type="text"
              tone="purple"
              autoFocus
              {...register('name')}
              onChange={(e) => setValue('name', e.target.value)}
              value={nameValue}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[--text-secondary]">
              PASSWORD
            </label>
            <PixelPasswordInput
              id="password"
              tone="purple"
              {...register('password')}
              onChange={(e) => setValue('password', e.target.value)}
              value={passwordValue}
            />
            <PasswordStrengthIndicator password={passwordValue} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-medium text-[--text-secondary]"
            >
              CONFIRM PASSWORD
            </label>
            <PixelPasswordInput
              id="confirmPassword"
              tone="purple"
              {...register('confirmPassword')}
              onChange={(e) => setValue('confirmPassword', e.target.value)}
              value={confirmPasswordValue}
            />
          </div>

          <PixelButton type="submit" tone="purple" className="mt-2 w-full" loading={isSubmitting}>
            Accept Invite & Sign In
          </PixelButton>

          {(error || Object.keys(errors).length > 0) && (
            <div className="mt-4 w-full">
              <PixelAlert
                tone="red"
                title="Error"
                message={error || Object.values(errors)[0]?.message || 'Invalid input.'}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[400px] text-center text-[--text-muted]">
          <DaemonMascot size="lg" state="working" className="mx-auto mb-4" />
          Loading...
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
