'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { changePasswordFormSchema, type ChangePasswordFormValues } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function getStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (password.length === 0) return 0;
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const mixed = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length >= 3;

  if (len >= 16 && mixed) return 4;
  if (len >= 12) return 3;
  if (len >= 8) return 2;
  return 1;
}

const STRENGTH_COLORS: Record<number, string> = {
  0: 'bg-surface-inset',
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-warning',
  4: 'bg-success',
};

const STRENGTH_LABELS = ['None', 'Weak', 'Fair', 'Good', 'Strong'] as const;

function StrengthIndicator({ password }: { password: string }) {
  const level = getStrength(password);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1" aria-hidden="true">
        {([1, 2, 3, 4] as const).map((seg) => (
          <div
            key={seg}
            className={`h-1 flex-1 rounded-full transition-colors ${
              password.length > 0 && seg <= level ? STRENGTH_COLORS[level] : 'bg-surface-inset'
            }`}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-fg-muted text-xs">Password strength: {STRENGTH_LABELS[level]}</p>
      )}
    </div>
  );
}

export function ChangePasswordSection() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // The strength meter has to react as the user types, so this field is read
  // rather than left uncontrolled like the other two.
  const newPassword = watch('newPassword');

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      const res = await fetch('/api/v1/users/me/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = data?.error?.code ?? '';
        if (code === 'INVALID_PASSWORD') {
          // Only the server can tell us this one, so it is surfaced as a field
          // error rather than a toast — it is the user's next action.
          setError('currentPassword', { message: 'Current password is incorrect.' });
          return;
        }
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      toast.success('Password updated.');
      reset();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to update password', error);
      toast.error('Failed to update password.');
    }
  };

  return (
    <section className="border-line bg-surface-raised flex max-w-2xl flex-col gap-4 rounded-lg border p-6">
      <h3 className="text-fg text-base font-semibold">Change password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary text-xs" htmlFor="current-password">
            Current password
          </label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p id="current-password-error" className="text-danger text-xs">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary text-xs" htmlFor="new-password">
            New password
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
            {...register('newPassword')}
          />
          <StrengthIndicator password={newPassword} />
          {errors.newPassword && (
            <p id="new-password-error" className="text-danger text-xs">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary text-xs" htmlFor="confirm-password">
            Confirm new password
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-danger text-xs">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>
    </section>
  );
}
