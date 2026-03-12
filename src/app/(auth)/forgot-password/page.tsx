'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PixelInput, PixelButton, PixelAlert, PixelCard } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Failed to send reset link');
      }

      setIsSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="bg-[--bg-surface] border-[--border-default] p-8 flex flex-col items-center text-center">
          <DaemonMascot size="lg" state="success" className="mb-4" />
          <h1 className="font-bold text-lg mb-2 text-[--text-primary]">Check your email.</h1>
          <p className="text-sm text-[--text-muted] mb-8">
            If an account exists, a reset link is on its way.
          </p>
          <Link href="/login" className="text-sm text-[--accent-violet] hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="bg-[--bg-surface] border-[--border-default] p-8 flex flex-col items-center">
        <DaemonMascot size="lg" state={isLoading ? 'working' : error ? 'error' : 'idle'} className="mb-4" />
        <h1 className="font-bold text-lg mb-2 text-[--text-primary] tracking-widest uppercase">FORGOT PASSWORD</h1>
        <p className="text-sm text-[--text-muted] mb-8 text-center">
          Enter your email and we'll send a reset link.
        </p>

        {error && (
          <div className="w-full mb-6">
            <PixelAlert tone="red" title="Error" message={error} />
          </div>
        )}

        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[--text-secondary]">EMAIL</label>
            <PixelInput
              id="email"
              type="email"
              tone="purple"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <PixelButton
            type="submit"
            tone="purple"
            className="w-full"
            loading={isLoading}
          >
            Send Reset Link
          </PixelButton>

          <div className="text-center mt-2">
            <Link href="/login" className="text-sm text-[--text-muted] hover:text-[--text-primary] hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
