'use client';

import { useActionState, useRef } from 'react';
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

type LoginState = {
  error: string | null;
  expression: 'idle' | 'working' | 'error';
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const formRef = useRef<HTMLFormElement>(null);

  const loginAction = async (prevState: LoginState, formData: FormData): Promise<LoginState> => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: next,
    });

    if (signInError) {
      clientLogger.error('Login failed', signInError);
      return { error: 'Invalid email or password.', expression: 'error' };
    }

    if (data) {
      router.push(next);
    }

    return { error: null, expression: 'working' };
  };

  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
    expression: 'idle',
  });

  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

  const expression = isPending ? 'working' : state.expression;

  return (
    <Card className="border-border-default bg-bg-surface w-full max-w-sm">
      <CardHeader className="items-center gap-2 pb-2">
        <DaemonMascot size={48} expression={expression} />
        <div className="text-center">
          <p className="text-text-primary font-mono text-sm font-bold tracking-widest">SPECDRIVR</p>
          <p className="text-text-secondary font-mono text-xs tracking-tight uppercase">
            Build what you spec.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-text-secondary font-mono text-xs uppercase">
              Email
            </Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-text-secondary font-mono text-xs uppercase">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="border-border-default bg-bg-base"
              required
            />
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription className="font-mono text-xs">{state.error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="bg-accent-violet hover:bg-accent-violet-dim w-full font-mono text-sm tracking-wider uppercase transition-colors"
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </Button>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-text-muted hover:text-text-secondary font-mono text-[10px] uppercase underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        {isDev && (
          <div className="border-border-muted mt-4 space-y-2 border-t border-dashed pt-4">
            <p className="text-text-secondary font-mono text-xs tracking-widest">DEV QUICK LOGIN</p>
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
                className="hover:bg-accent-violet/5 hover:text-accent-violet w-full font-mono text-xs transition-colors"
                onClick={() => {
                  if (formRef.current) {
                    (formRef.current.elements.namedItem('email') as HTMLInputElement).value =
                      quickEmail;
                    (formRef.current.elements.namedItem('password') as HTMLInputElement).value =
                      'Password123!';
                    formRef.current.requestSubmit();
                  }
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
