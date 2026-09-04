'use client';

import { useActionState, useRef, useState, useEffect, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '@/lib/schemas';
import { authClient } from '@/lib/auth-client';
import { clientLogger } from '@/lib/logger-client';
import { getSafeInternalPath } from '@/lib/redirects';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type LoginValues = z.infer<typeof loginSchema>;

type LoginState = {
  error: string | null;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeInternalPath(searchParams.get('next'));
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    // useForm()
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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
      return { error: 'Invalid email or password.' };
    }

    if (data) {
      router.push(next);
    }

    return { error: null };
  };

  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
  });

  const [isDev, setIsDev] = useState(false);
  useEffect(() => {
    setIsDev(window.location.hostname === 'localhost');
  }, []);

  const onValid = () => {
    const form = formRef.current;
    if (form) {
      startTransition(() => {
        formAction(new FormData(form));
      });
    }
  };

  return (
    <Card className="border-line bg-surface-raised w-full max-w-sm">
      <CardHeader className="items-center gap-2 pb-2">
        <BrandMark size={48} className={isPending ? 'animate-pulse' : undefined} />
        <div className="text-center">
          <p className="text-fg font-mono text-lg font-semibold tracking-[-0.04em]">specdrivr</p>
          <p className="text-fg-secondary text-xs tracking-tight">Build what you spec.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit(onValid)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-fg-muted text-2xs">
              Email
            </Label>
            <Input
              id="email"
              {...register('email')}
              type="email"
              autoFocus
              placeholder="you@example.com"
              className="border-line bg-surface-base"
            />
            {errors.email && <p className="text-danger text-2xs">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-fg-muted text-2xs">
              Password
            </Label>
            <Input
              id="password"
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="border-line bg-surface-base"
            />
            {errors.password && <p className="text-danger text-2xs">{errors.password.message}</p>}
          </div>

          {(state.error || errors.root) && (
            <Alert variant="destructive">
              <AlertDescription className="font-mono text-xs">
                {state.error || errors.root?.message}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="bg-surface-inset hover:bg-accent-hover w-full text-sm transition-colors"
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </Button>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-fg-muted hover:text-fg-secondary text-2xs underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        {isDev && (
          <div className="border-line-subtle mt-4 space-y-2 border-t border-dashed pt-4">
            <p className="text-fg-secondary font-mono text-xs">Dev quick login</p>
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
                className="hover:bg-accent-subtle hover:text-accent w-full font-mono text-xs transition-colors"
                onClick={() => {
                  setValue('email', quickEmail);
                  setValue('password', 'Password123!');
                  formRef.current?.requestSubmit();
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
