'use client';

import { useActionState, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordSchema } from '@/lib/schemas';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { clientLogger } from '@/lib/logger-client';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_COLORS = ['bg-danger', 'bg-warning', 'bg-warning', 'bg-success'];

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const formRef = useRef<HTMLFormElement>(null);

  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    // useForm()
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const resetAction = async (
    prevState: string | null,
    formData: FormData
  ): Promise<string | null> => {
    const newPassword = formData.get('password') as string;

    if (!token) return 'Missing token.';

    const { error: resetError } = await authClient.resetPassword({ newPassword, token });

    if (resetError) {
      clientLogger.error('Reset password failed', resetError);
      return 'Failed to reset password. The link may have expired.';
    }

    toast.success('Password updated. Please sign in.');
    router.push('/login');
    return null;
  };

  const [error, formAction, isPending] = useActionState(resetAction, null);

  const onValid = () => {
    formRef.current?.requestSubmit();
  };

  if (!token) {
    return (
      <Card className="border-line bg-surface-raised w-full max-w-sm">
        <CardContent className="space-y-3 pt-6 text-center">
          <BrandMark size={48} />
          <p className="text-fg text-sm">This link has expired.</p>
          <Link href="/forgot-password" className="text-accent text-xs hover:underline">
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  const strength = getStrength(passwordValue);

  return (
    <Card className="border-line bg-surface-raised w-full max-w-sm">
      <CardHeader className="items-center gap-2 pb-2">
        <BrandMark size={48} />
        <p className="font-mono text-sm font-bold tracking-widest">SPECDRIVR</p>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit(onValid)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              {...register('password', {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
              type="password"
              className="border-line bg-surface-base"
            />
            {passwordValue && (
              <div className="mt-1 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < strength ? STRENGTH_COLORS[strength - 1] : 'bg-line-subtle'}`}
                  />
                ))}
              </div>
            )}
            {errors.password && (
              <p className="text-danger text-[10px]">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              {...register('confirmPassword')}
              type="password"
              className="border-line bg-surface-base"
            />
            {errors.confirmPassword && (
              <p className="text-danger text-[10px]">{errors.confirmPassword.message}</p>
            )}
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
          <Button
            type="submit"
            disabled={isPending}
            className="bg-surface-inset hover:bg-accent-hover w-full"
          >
            {isPending ? 'Updating…' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
