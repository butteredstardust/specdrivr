'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { acceptInviteFormSchema, type AcceptInviteFormValues } from '@/lib/schemas';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type TokenState = 'loading' | 'valid' | 'invalid';

/** Mirrors the payload of `GET /api/v1/auth/invite`. */
interface InviteData {
  email: string;
  projectName: string;
  isExistingUser: boolean;
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);

  // An invitee who already has an account only gets added to the project, so
  // the credential fields are neither shown nor required for them.
  const isExistingUser = invite?.isExistingUser ?? false;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteFormSchema(isExistingUser)),
    defaultValues: { name: '', password: '' },
  });

  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    fetch(`/api/v1/auth/invite?token=${encodeURIComponent(token)}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json: { data: InviteData }) => {
        setInvite(json.data);
        setTokenState('valid');
      })
      .catch((err: unknown) => {
        clientLogger.error(
          'Invite token invalid',
          err instanceof Error ? err : new Error(String(err))
        );
        setTokenState('invalid');
      });
  }, [token]);

  const onSubmit = async (values: AcceptInviteFormValues) => {
    try {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          isExistingUser ? { token } : { token, name: values.name, password: values.password }
        ),
      });
      if (!res.ok) throw new Error('Failed to accept invite');
      toast.success('Welcome to the project!');
      router.push('/');
    } catch (err) {
      clientLogger.error(
        'Accept invite error',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Failed to accept invite. Please try again.');
    }
  };

  if (tokenState === 'loading') {
    return (
      <Card className="border-line bg-surface-raised w-full max-w-sm">
        <CardContent className="flex justify-center pt-6">
          <BrandMark size={48} className="animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <Card className="border-line bg-surface-raised w-full max-w-sm">
        <CardContent className="space-y-3 pt-6 text-center">
          <BrandMark size={48} />
          <p className="text-fg text-sm">This invite link has expired.</p>
          <p className="text-fg-muted text-xs">Ask your admin to send a new invitation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-line bg-surface-raised w-full max-w-sm">
      <CardHeader className="items-center gap-2 pb-2">
        <BrandMark size={48} />
        <div className="text-center">
          <p className="text-fg font-mono text-lg font-semibold tracking-[-0.04em]">specdrivr</p>
          {invite && (
            <p className="text-fg-muted text-xs">
              You&apos;ve been invited to <strong>{invite.projectName}</strong>
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={invite?.email ?? ''}
              readOnly
              className="border-line bg-surface-base opacity-60"
            />
          </div>
          {!isExistingUser && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  className="border-line bg-surface-base"
                  {...register('name')}
                />
                {errors.name && <p className="text-danger text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Create password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  className="border-line bg-surface-base"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-danger text-xs">{errors.password.message}</p>
                )}
              </div>
            </>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-surface-inset hover:bg-accent-hover w-full"
          >
            {isSubmitting ? 'Joining…' : 'Accept Invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
