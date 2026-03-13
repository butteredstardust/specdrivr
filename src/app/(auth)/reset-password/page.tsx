'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { PixelPasswordInput, PixelButton, PixelAlert } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { twMerge } from 'tailwind-merge';

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
    if (score < index) return 'bg-[--bg-base]'; // unfilled

    // Filled color depends on current score
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidatingToken(false);
      setIsTokenValid(false);
      return;
    }

    // Since we don't have a direct endpoint to just "validate" a token without using it in BetterAuth,
    // we'll assume it's valid for the form and catch the error on submission.
    // The spec asks to check on page load by calling the API, but our API is a POST to reset.
    // We will just show the form if token exists. If it fails on submit, we show the error.
    setIsValidatingToken(false);
    setIsTokenValid(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }

    if (!token) {
      setError('Invalid or missing token.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setIsTokenValid(false); // Token might be expired
        setError(resetError.message || 'Failed to reset password. Link may have expired.');
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="w-full max-w-[400px] text-center text-[--text-muted]">
        <DaemonMascot size="lg" state="working" className="mx-auto mb-4" />
        Validating link...
      </div>
    );
  }

  if (!isTokenValid && !isSuccess) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8 text-center">
          <DaemonMascot size="lg" state="error" className="mb-4" />
          <h1 className="mb-2 text-lg font-bold text-[--text-primary]">This link has expired.</h1>
          <p className="mb-8 text-sm text-[--text-muted]">
            Password reset links are valid for 1 hour.
          </p>
          <PixelButton
            tone="neutral"
            className="w-full"
            onClick={() => router.push('/forgot-password')}
          >
            Request a new link
          </PixelButton>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8 text-center">
          <DaemonMascot size="lg" state="success" className="mb-4" />
          <h1 className="mb-8 text-lg font-bold text-[--text-primary]">Password updated.</h1>
          <PixelButton tone="purple" className="w-full" onClick={() => router.push('/login')}>
            Sign in
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
          state={isLoading ? 'working' : error ? 'error' : 'idle'}
          className="mb-4"
        />
        <h1 className="mb-8 text-lg font-bold tracking-widest text-[--text-primary] uppercase">
          RESET PASSWORD
        </h1>

        {error && (
          <div className="mb-6 w-full">
            <PixelAlert tone="red" title="Error" message={error} />
          </div>
        )}

        <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[--text-secondary]">
              NEW PASSWORD
            </label>
            <PixelPasswordInput
              id="password"
              tone="purple"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrengthIndicator password={password} />
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
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <PixelButton type="submit" tone="purple" className="mt-2 w-full" loading={isLoading}>
            Set New Password
          </PixelButton>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[400px] text-center text-[--text-muted]">
          <DaemonMascot size="lg" state="working" className="mx-auto mb-4" />
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
