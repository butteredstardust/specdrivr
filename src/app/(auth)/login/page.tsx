'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expression, setExpression] = useState<'idle' | 'working' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExpression('working');

    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: next,
    });

    if (signInError) {
      clientLogger.error('Login failed', signInError);
      setError('Invalid email or password.');
      setExpression('error');
      setLoading(false);
      return;
    }

    if (data) {
      router.push(next);
    }
  };

  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

  return (
    <Card className="w-full max-w-sm border-[--border-default] bg-[--bg-surface]">
      <CardHeader className="items-center gap-2 pb-2">
        <DaemonMascot size={48} expression={expression} />
        <div className="text-center">
          <p className="font-mono text-sm font-bold tracking-widest text-[--text-primary]">
            SPECDRIVR
          </p>
          <p className="text-xs text-[--text-muted]">Build what you spec.</p>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-[--border-default] bg-[--bg-base]"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[--accent-violet] hover:bg-[--accent-violet-dim]"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-[--text-muted] hover:text-[--text-secondary]"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        {isDev && (
          <div className="mt-4 space-y-2 border-t border-dashed border-[--border-muted] pt-4">
            <p className="font-mono text-xs text-[--text-muted]">DEV QUICK LOGIN</p>
            {[
              { label: 'Owner', email: 'alex@specdrivr.dev' },
              { label: 'Admin', email: 'sam@specdrivr.dev' },
              { label: 'Member', email: 'jordan@specdrivr.dev' },
            ].map(({ label, email: quickEmail }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={async () => {
                  setEmail(quickEmail);
                  setPassword('Password123!');
                  const { data } = await authClient.signIn.email({
                    email: quickEmail,
                    password: 'Password123!',
                    callbackURL: next,
                  });
                  if (data) router.push(next);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
