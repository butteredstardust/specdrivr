'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_COLORS = [
  'bg-[--status-red]',
  'bg-[--status-orange]',
  'bg-[--phosphor-amber]',
  'bg-[--status-emerald]',
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <Card className="w-full max-w-sm border-[--border-default] bg-[--bg-surface]">
        <CardContent className="space-y-3 pt-6 text-center">
          <DaemonMascot size={48} expression="error" />
          <p className="text-sm text-[--text-primary]">This link has expired.</p>
          <Link href="/forgot-password" className="text-xs text-[--accent-violet] hover:underline">
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({ newPassword, token });
    if (resetError) {
      clientLogger.error('Reset password failed', resetError);
      setError('Failed to reset password. The link may have expired.');
      setLoading(false);
      return;
    }
    toast.success('Password updated. Please sign in.');
    router.push('/login');
  };

  return (
    <Card className="w-full max-w-sm border-[--border-default] bg-[--bg-surface]">
      <CardHeader className="items-center gap-2 pb-2">
        <DaemonMascot size={48} expression="idle" />
        <p className="font-mono text-sm font-bold tracking-widest">SPECDRIVR</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-[--border-default] bg-[--bg-base]"
            />
            {newPassword && (
              <div className="mt-1 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < strength ? STRENGTH_COLORS[strength - 1] : 'bg-[--border-muted]'}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-[--border-default] bg-[--bg-base]"
            />
          </div>
          {error && <p className="text-xs text-[--status-red]">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[--accent-violet] hover:bg-[--accent-violet-dim]"
          >
            {loading ? 'Updating…' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
