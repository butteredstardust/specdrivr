'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type State = 'idle' | 'loading' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch (err) {
      clientLogger.error(
        'Forgot password error',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Something went wrong. Please try again.');
    }
    // Always show success (prevents email enumeration)
    setState('sent');
  };

  return (
    <Card className="w-full max-w-sm border-[--border-default] bg-[--bg-surface]">
      <CardHeader className="items-center gap-2 pb-2">
        <DaemonMascot size={48} expression={state === 'sent' ? 'success' : 'idle'} />
        <p className="font-mono text-sm font-bold tracking-widest">SPECDRIVR</p>
      </CardHeader>
      <CardContent>
        {state === 'sent' ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-[--text-primary]">Check your email.</p>
            <p className="text-xs text-[--text-muted]">
              If that address is registered, a reset link is on its way.
            </p>
            <Link href="/login" className="text-xs text-[--accent-violet] hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border-[--border-default] bg-[--bg-base]"
              />
            </div>
            <Button
              type="submit"
              disabled={state === 'loading'}
              className="w-full bg-[--accent-violet] hover:bg-[--accent-violet-dim]"
            >
              {state === 'loading' ? 'Sending…' : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="text-xs text-[--text-muted] hover:text-[--text-secondary]"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
