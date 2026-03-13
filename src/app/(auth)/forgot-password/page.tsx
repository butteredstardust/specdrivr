'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PixelInput, PixelButton, PixelAlert } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  const onForgotPassword = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
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
        <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8 text-center">
          <DaemonMascot size="lg" state="success" className="mb-4" />
          <h1 className="mb-2 text-lg font-bold text-[--text-primary]">Check your email.</h1>
          <p className="mb-8 text-sm text-[--text-muted]">
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
      <div className="flex flex-col items-center border-[--border-default] bg-[--bg-surface] p-8">
        <DaemonMascot
          size="lg"
          state={isLoading ? 'working' : error ? 'error' : 'idle'}
          className="mb-4"
        />
        <h1 className="mb-2 text-lg font-bold tracking-widest text-[--text-primary] uppercase">
          FORGOT PASSWORD
        </h1>
        <p className="mb-8 text-center text-sm text-[--text-muted]">
          Enter your email and we'll send a reset link.
        </p>

        <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit(onForgotPassword)}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[--text-secondary]">
              EMAIL
            </label>
            <PixelInput
              id="email"
              type="email"
              tone="purple"
              autoFocus
              {...register('email')}
              onChange={(e) => setValue('email', e.target.value)}
              value={emailValue}
            />
          </div>

          <PixelButton type="submit" tone="purple" className="w-full" loading={isLoading}>
            Send Reset Link
          </PixelButton>

          {(error || Object.keys(errors).length > 0) && (
            <div className="mt-2 w-full">
              <PixelAlert
                tone="red"
                title="Error"
                message={error || Object.values(errors)[0]?.message || 'Invalid input.'}
              />
            </div>
          )}

          <div className="mt-2 text-center">
            <Link
              href="/login"
              className="text-sm text-[--text-muted] hover:text-[--text-primary] hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
