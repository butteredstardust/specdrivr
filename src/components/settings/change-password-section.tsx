'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
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
  0: 'bg-[--surface-hover]',
  1: 'bg-[--status-red]',
  2: 'bg-[--phosphor-amber]',
  3: 'bg-[--phosphor-amber]',
  4: 'bg-[--status-emerald]',
};

function StrengthIndicator({ password }: { password: string }) {
  const level = getStrength(password);

  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4] as const).map((seg) => (
        <div
          key={seg}
          className={`h-1 flex-1 rounded-full transition-colors ${
            password.length > 0 && seg <= level ? STRENGTH_COLORS[level] : 'bg-[--surface-hover]'
          }`}
        />
      ))}
    </div>
  );
}

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset inline errors
    setCurrentPasswordError('');
    setConfirmError('');

    // Client-side validation
    if (newPassword.length < 12) {
      setConfirmError('New password must be at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/v1/users/me/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = data?.error?.code ?? '';
        if (code === 'INVALID_PASSWORD') {
          setCurrentPasswordError('Current password is incorrect.');
          setIsSaving(false);
          return;
        }
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to update password', error);
      toast.error('Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
        CHANGE PASSWORD
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-[--text-secondary]" htmlFor="current-password">
            CURRENT PASSWORD
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {currentPasswordError && (
            <p className="font-mono text-xs text-[--status-red]">{currentPasswordError}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-[--text-secondary]" htmlFor="new-password">
            NEW PASSWORD
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <StrengthIndicator password={newPassword} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-[--text-secondary]" htmlFor="confirm-password">
            CONFIRM NEW PASSWORD
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {confirmError && <p className="font-mono text-xs text-[--status-red]">{confirmError}</p>}
        </div>

        <div>
          <Button type="submit" disabled={isSaving} size="sm">
            {isSaving ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </form>
    </section>
  );
}
