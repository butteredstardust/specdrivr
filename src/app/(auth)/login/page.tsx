'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { PixelInput, PixelPasswordInput, PixelButton, PixelAlert } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const callbackURL = searchParams.get('next') || '/';

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL,
      });

      if (signInError) {
        setError('Invalid email or password.');
      } else {
        router.push(callbackURL);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInAs = async (demoEmail: string) => {
    setIsLoading(true);
    setError(null);
    const callbackURL = searchParams.get('next') || '/';

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: demoEmail,
        password: 'Password123!',
        callbackURL,
      });

      if (signInError) {
        setError('Invalid email or password.');
      } else {
        router.push(callbackURL);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="bg-[--bg-surface] border-[--border-default] p-8 flex flex-col items-center">
        <DaemonMascot size="lg" state={isLoading ? 'working' : error ? 'error' : 'idle'} className="mb-4" />
        <h1 className="font-mono font-bold text-2xl mb-1 text-[--text-primary]">SPECDRIVR</h1>
        <p className="text-sm text-[--text-muted] mb-8">Build what you spec.</p>

        {error && (
          <div className="w-full mb-6">
            <PixelAlert tone="red" title="Error" message={error} />
          </div>
        )}

        <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[--text-secondary]">EMAIL</label>
            <PixelInput
              id="email"
              type="email"
              tone="purple"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[--text-secondary]">PASSWORD</label>
            <PixelPasswordInput
              id="password"
              tone="purple"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mt-2">
            <PixelButton
              type="submit"
              tone="purple"
              className="w-full"
              loading={isLoading}
            >
              Sign In
            </PixelButton>
          </div>

          <div className="text-right mt-2">
            <Link href="/forgot-password" className="text-sm text-[--accent-violet] hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border border-dashed border-[--border-muted] rounded-lg p-4">
          <p className="text-xs text-[--text-muted] mb-3 font-mono uppercase tracking-wider">
            DEMO ACCESS
          </p>
          <div className="flex gap-2 flex-wrap">
            <PixelButton tone="neutral" size="sm" onClick={() => signInAs('admin@example.com')} loading={isLoading}>
              Admin
            </PixelButton>
            <PixelButton tone="neutral" size="sm" onClick={() => signInAs('test@example.com')} loading={isLoading}>
              Member
            </PixelButton>
            <PixelButton tone="neutral" size="sm" onClick={() => signInAs('viewer@example.com')} loading={isLoading}>
              Viewer
            </PixelButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px] text-center text-[--text-muted]">
        <DaemonMascot size="lg" state="working" className="mx-auto mb-4" />
        Loading...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
