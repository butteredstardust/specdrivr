'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Loader2, Copy, Plus } from 'lucide-react';
import { useShell } from '@/components/shell/shell-context';

interface TokenRow {
  id: number;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

type ExpiryOption = '30d' | '90d' | '1y' | 'never';

const generateTokenSchema = z.object({
  tokenName: z.string().min(1, 'Token name is required'),
  expiryOption: z.enum(['30d', '90d', '1y', 'never']),
});

type GenerateTokenValues = z.infer<typeof generateTokenSchema>;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function computeExpiresAt(option: ExpiryOption): string | null {
  if (option === 'never') return null;
  const now = new Date();
  if (option === '30d') now.setDate(now.getDate() + 30);
  else if (option === '90d') now.setDate(now.getDate() + 90);
  else if (option === '1y') now.setFullYear(now.getFullYear() + 1);
  return now.toISOString();
}

export function ApiTokensSection() {
  const { activeProjectId } = useShell();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealToken, setRevealToken] = useState('');
  const [revokeTargetId, setRevokeTargetId] = useState<number | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<GenerateTokenValues>({
    resolver: zodResolver(generateTokenSchema),
    defaultValues: { tokenName: '', expiryOption: '90d' },
  });

  const stopWhen = useCallback((data: TokenRow[]) => {
    setTokens(data);
    return true;
  }, []);

  const { isLoading, error, restart } = usePolling<TokenRow[]>({
    url: '/api/v1/users/me/tokens',
    stopWhen,
  });

  const handleGenerate = async (values: GenerateTokenValues) => {
    if (activeProjectId === null) {
      toast.error('Select a project before generating an agent token.');
      return;
    }

    try {
      const expiresAt = computeExpiresAt(values.expiryOption);
      const res = await fetch('/api/v1/users/me/tokens', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.tokenName.trim(),
          projectId: activeProjectId,
          expiresAt,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      const { id, name, token } = data.data as { id: number; name: string; token: string };
      const prefix = token.slice(0, 10);

      setTokens((prev) => [
        { id, name, prefix, lastUsedAt: null, expiresAt, createdAt: new Date().toISOString() },
        ...prev,
      ]);

      setGenerateOpen(false);
      reset();
      setRevealToken(token);
      setRevealOpen(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to generate token', error);
      toast.error('Failed to generate token.');
    }
  };

  const handleRevoke = async () => {
    if (revokeTargetId === null) return;
    setIsRevoking(true);

    try {
      const res = await fetch(`/api/v1/users/me/tokens/${revokeTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      toast.success('Token revoked.');
      setTokens((prev) => prev.filter((t) => t.id !== revokeTargetId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to revoke token', error);
      toast.error('Failed to revoke token.');
    } finally {
      setIsRevoking(false);
      setRevokeTargetId(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revealToken);
      toast.success('Copied!');
    } catch {
      toast.error('Failed to copy.');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-fg-muted text-2xs font-medium">API tokens</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-mono text-xs"
          onClick={() => setGenerateOpen(true)}
        >
          <Plus className="size-3" />
          Generate Token
        </Button>
      </div>
      <p className="text-fg-muted text-sm">
        Use tokens to authenticate the DAEMON agent or external integrations.
      </p>

      {isLoading && (
        <div className="text-fg-muted flex items-center gap-2">
          <Loader2 className="size-3 animate-spin" />
          <span className="font-mono text-xs">Loading tokens…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="text-danger font-mono text-xs">Failed to load tokens.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="text-fg-muted hover:text-fg h-auto px-0 font-mono text-xs underline hover:bg-transparent"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {tokens.length === 0 ? (
            <p className="text-fg-muted font-mono text-xs">No API tokens yet.</p>
          ) : (
            <div className="border-line flex flex-col gap-0 overflow-hidden rounded border">
              {/* Header row */}
              <div className="border-line grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b px-3 py-2">
                {['NAME', 'PREFIX', 'CREATED', 'LAST USED', 'EXPIRES'].map((col) => (
                  <span key={col} className="text-fg-muted font-mono text-xs">
                    {col}
                  </span>
                ))}
              </div>

              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="border-line grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b px-3 py-2.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Key className="text-fg-muted size-3 shrink-0" />
                    <span className="text-fg truncate font-mono text-xs">{t.name}</span>
                  </div>
                  <span className="text-fg-muted font-mono text-xs">{t.prefix}&hellip;</span>
                  <span className="text-fg-muted font-mono text-xs">{formatDate(t.createdAt)}</span>
                  <span className="text-fg-muted font-mono text-xs">
                    {formatDate(t.lastUsedAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-fg-muted font-mono text-xs">
                      {formatDate(t.expiresAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger-bg hover:text-danger h-auto px-1.5 py-0.5 font-mono text-xs"
                      onClick={() => setRevokeTargetId(t.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Generate token dialog */}
      <Dialog
        open={generateOpen}
        onOpenChange={(open) => {
          setGenerateOpen(open);
          if (!open) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Generate API Token</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleGenerate)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-fg-secondary font-mono text-xs" htmlFor="token-name">
                TOKEN NAME <span className="text-danger">*</span>
              </label>
              <Input id="token-name" placeholder="e.g. CI Deploy" {...register('tokenName')} />
              {errors.tokenName && (
                <p className="text-danger font-mono text-xs">{errors.tokenName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-fg-secondary font-mono text-xs" htmlFor="token-expiry">
                EXPIRY
              </label>
              <Controller
                name="expiryOption"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="token-expiry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                      <SelectItem value="1y">1 year</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setGenerateOpen(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Generating…' : 'Generate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-time reveal dialog */}
      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Your new API token</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-fg-muted font-mono text-xs">
              This token is shown once only. Copy it now — you will not be able to see it again.
            </p>
            <div className="border-line bg-surface-raised flex items-center gap-2 rounded border px-3 py-2">
              <code className="text-warning flex-1 font-mono text-xs break-all">{revealToken}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
                <Copy className="size-3" />
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setRevealOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm dialog */}
      <AlertDialog
        open={revokeTargetId !== null}
        onOpenChange={(open) => !open && setRevokeTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">Revoke token?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              This token will be permanently revoked. Any applications using it will stop working
              immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              {isRevoking ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
