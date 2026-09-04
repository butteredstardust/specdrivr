'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type TokenState = 'loading' | 'valid' | 'invalid';

interface InviteData {
  email: string;
  projectName: string;
  inviterName: string;
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, name, password }),
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
    } finally {
      setLoading(false);
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
          <p className="font-mono text-sm font-bold tracking-widest">SPECDRIVR</p>
          {invite && (
            <p className="text-fg-muted text-xs">
              {invite.inviterName} invited you to <strong>{invite.projectName}</strong>
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-line bg-surface-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-line bg-surface-base"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-surface-inset hover:bg-accent-hover w-full"
          >
            {loading ? 'Joining…' : 'Accept Invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
