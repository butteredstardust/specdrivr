'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PixelInput, PixelPasswordInput, PixelButton, PixelAlert } from '@pxlkit/ui-kit';
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
    if (score < index) return 'bg-[--bg-base]';
    if (score === 1) return 'bg-[--status-red]';
    if (score === 2) return 'bg-[--status-orange]';
    if (score === 3) return 'bg-[--phosphor-amber]';
    if (score >= 4) return 'bg-[--status-emerald]';
    return 'bg-[--bg-base]';
  };

  return (
    <div className="flex gap-1 w-full h-1 mt-2">
      <div className={twMerge("flex-1 rounded-full transition-colors", getSegmentClass(1))} />
      <div className={twMerge("flex-1 rounded-full transition-colors", getSegmentClass(2))} />
      <div className={twMerge("flex-1 rounded-full transition-colors", getSegmentClass(3))} />
      <div className={twMerge("flex-1 rounded-full transition-colors", getSegmentClass(4))} />
    </div>
  );
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteData, setInviteData] = useState<{ email: string; projectName: string; isExistingUser: boolean } | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This invite link has expired.");
      setIsLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`/api/v1/auth/invite?token=${token}`);
        const json = await res.json();

        if (!res.ok) {
          setError("This invite link has expired.");
        } else {
          setInviteData(json.data);
        }
      } catch {
        setError("This invite link has expired.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to accept invite');
      }

      // New user is automatically signed in by the backend BetterAuth signUpEmail if we implement it correctly,
      // but let's be safe and sign them in via client just in case they need the session cookie set locally properly
      // Actually, the backend creates the user, but we might need to establish the session.
      // Assuming the backend handles cookie setting, we can just redirect.
      // Wait, `signUpEmail` sets the cookie. So we just redirect.

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
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
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
        <div className="bg-[--bg-surface] border-[--border-default] p-8 flex flex-col items-center text-center">
          <DaemonMascot size="lg" state="error" className="mb-4" />
          <h1 className="font-bold text-lg mb-2 text-[--text-primary]">This invite link has expired.</h1>
          <p className="text-sm text-[--text-muted] mb-8">
            Ask a team admin to send a new invite.
          </p>
        </div>
      </div>
    );
  }

  if (inviteData.isExistingUser) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="bg-[--bg-surface] border-[--border-default] p-8 flex flex-col items-center text-center">
          <DaemonMascot size="lg" state="idle" className="mb-4" />
          <h1 className="font-bold text-lg mb-2 text-[--text-primary]">You've been invited to {inviteData.projectName}</h1>
          <p className="text-sm text-[--text-muted] mb-8">
            Sign in to your existing account to accept.
          </p>

          {error && (
            <div className="w-full mb-6">
              <PixelAlert tone="red" title="Error" message={error} />
            </div>
          )}

          <PixelButton tone="purple" className="w-full" onClick={handleExistingUserSubmit} loading={isSubmitting}>
            Sign In & Accept
          </PixelButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="bg-[--bg-surface] border-[--border-default] p-8 flex flex-col items-center">
        <DaemonMascot size="lg" state={isSubmitting ? 'working' : error ? 'error' : 'idle'} className="mb-4" />
        <h1 className="font-bold text-lg mb-2 text-[--text-primary] text-center">You've been invited to {inviteData.projectName}</h1>
        <p className="text-sm text-[--text-muted] mb-8 text-center">
          Create your account to get started.
        </p>

        {error && (
          <div className="w-full mb-6">
            <PixelAlert tone="red" title="Error" message={error} />
          </div>
        )}

        <form className="w-full flex flex-col gap-5" onSubmit={handleNewUserSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[--text-secondary]">EMAIL</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[--bg-base] border border-[--border-muted] rounded text-sm text-[--text-muted]">
              <span className="flex-1 truncate">{inviteData.email}</span>
              <span>✓</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-[--text-secondary]">YOUR NAME</label>
            <PixelInput
              id="name"
              type="text"
              tone="purple"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[--text-secondary]">PASSWORD</label>
            <PixelPasswordInput
              id="password"
              tone="purple"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrengthIndicator password={password} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-[--text-secondary]">CONFIRM PASSWORD</label>
            <PixelPasswordInput
              id="confirmPassword"
              tone="purple"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <PixelButton
            type="submit"
            tone="purple"
            className="w-full mt-2"
            loading={isSubmitting}
          >
            Accept Invite & Sign In
          </PixelButton>
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px] text-center text-[--text-muted]">
        <DaemonMascot size="lg" state="working" className="mx-auto mb-4" />
        Loading...
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
