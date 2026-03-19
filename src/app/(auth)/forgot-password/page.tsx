'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type State = 'idle' | 'sent';

export default function ForgotPasswordPage() {
  const resetAction = async (prevState: State, formData: FormData): Promise<State> => {
    const email = formData.get('email') as string;
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
    return 'sent';
  };

  const [state, formAction, isPending] = useActionState(resetAction, 'idle');

  return (
    <Card className="border-border-default bg-bg-surface w-full max-w-sm">
      <CardHeader className="items-center gap-2 pb-2">
        <DaemonMascot size={48} expression={state === 'sent' ? 'success' : 'idle'} />
        <p className="font-mono text-sm font-bold tracking-widest">SPECDRIVR</p>
      </CardHeader>
      <CardContent>
        {state === 'sent' ? (
          <div className="space-y-3 text-center">
            <p className="text-text-primary text-sm">Check your email.</p>
            <p className="text-text-muted text-xs">
              If that address is registered, a reset link is on its way.
            </p>
            <Link href="/login" className="text-accent-violet text-xs hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoFocus
                placeholder="you@example.com"
                className="border-border-default bg-bg-base"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-accent-violet hover:bg-accent-violet-dim w-full"
            >
              {isPending ? 'Sending…' : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-text-muted hover:text-text-secondary text-xs">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
