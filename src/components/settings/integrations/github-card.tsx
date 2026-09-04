'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Github, Copy } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import type { PublicAgentConfig } from '@/lib/agent-config-public';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

import {
  ConnectedBadge,
  DisabledButtonWithTooltip,
  FormField,
  PasswordInput,
  type GitHubFields,
} from './shared';

interface GitHubCardProps {
  projectId: number;
  editable: boolean;
  initialData: PublicAgentConfig | null;
  onSaved: () => void;
}

export function GitHubCard({ projectId, editable, initialData, onSaved }: GitHubCardProps) {
  const [form, setForm] = useState<GitHubFields>({
    githubToken: '',
    githubRepo: initialData?.githubRepo ?? '',
    githubBranch: initialData?.githubBranch ?? 'main',
    githubWebhookSecret: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const connected = Boolean(initialData?.githubTokenConfigured && form.githubRepo);
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/github/${projectId}`
      : `/api/webhooks/github/${projectId}`;

  const set = <K extends keyof GitHubFields>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!editable) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/agent-config`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(form.githubToken.trim() ? { githubToken: form.githubToken.trim() } : {}),
          githubRepo: form.githubRepo.trim() || null,
          githubBranch: form.githubBranch.trim() || 'main',
          ...(form.githubWebhookSecret.trim()
            ? { githubWebhookSecret: form.githubWebhookSecret.trim() }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }
      toast.success('GitHub settings saved.');
      onSaved();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to save GitHub settings', error);
      toast.error('Failed to save GitHub settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!editable) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/agent-config`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: null,
          githubRepo: null,
          githubBranch: null,
          githubWebhookSecret: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }
      setForm({ githubToken: '', githubRepo: '', githubBranch: 'main', githubWebhookSecret: '' });
      toast.success('GitHub disconnected.');
      onSaved();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to disconnect GitHub', error);
      toast.error('Failed to disconnect GitHub');
    } finally {
      setIsSaving(false);
      setDisconnectOpen(false);
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <>
      <Card className="border-line bg-surface-raised h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Github className="text-fg-secondary size-4" />
            <CardTitle>GitHub</CardTitle>
          </div>
          <CardDescription className="text-fg-secondary text-xs">
            Connect your repository for automated commits.
          </CardDescription>
          <ConnectedBadge connected={connected} />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <FormField label="GitHub token" htmlFor="githubToken">
            {editable ? (
              <PasswordInput
                id="githubToken"
                value={form.githubToken}
                onChange={(v) => set('githubToken', v)}
                disabled={false}
                placeholder="ghp_••••••••••••"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <PasswordInput
                      id="githubToken"
                      value={form.githubToken}
                      onChange={(v) => set('githubToken', v)}
                      disabled
                      placeholder="ghp_••••••••••••"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin or Owner role</TooltipContent>
              </Tooltip>
            )}
          </FormField>

          <FormField label="Repository" htmlFor="githubRepo">
            {editable ? (
              <Input
                id="githubRepo"
                value={form.githubRepo}
                onChange={(e) => set('githubRepo', e.target.value)}
                disabled={false}
                placeholder="owner/repo-name"
                className="font-mono text-sm"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Input
                      id="githubRepo"
                      value={form.githubRepo}
                      onChange={(e) => set('githubRepo', e.target.value)}
                      disabled
                      placeholder="owner/repo-name"
                      className="font-mono text-sm"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin or Owner role</TooltipContent>
              </Tooltip>
            )}
          </FormField>

          <FormField label="Branch" htmlFor="githubBranch">
            {editable ? (
              <Input
                id="githubBranch"
                value={form.githubBranch}
                onChange={(e) => set('githubBranch', e.target.value)}
                disabled={false}
                placeholder="main"
                className="font-mono text-sm"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Input
                      id="githubBranch"
                      value={form.githubBranch}
                      onChange={(e) => set('githubBranch', e.target.value)}
                      disabled
                      placeholder="main"
                      className="font-mono text-sm"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin or Owner role</TooltipContent>
              </Tooltip>
            )}
          </FormField>

          <FormField label="Webhook secret" htmlFor="githubWebhookSecret">
            {editable ? (
              <PasswordInput
                id="githubWebhookSecret"
                value={form.githubWebhookSecret}
                onChange={(v) => set('githubWebhookSecret', v)}
                disabled={false}
                placeholder="whsec_••••••••••••"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <PasswordInput
                      id="githubWebhookSecret"
                      value={form.githubWebhookSecret}
                      onChange={(v) => set('githubWebhookSecret', v)}
                      disabled
                      placeholder="whsec_••••••••••••"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin or Owner role</TooltipContent>
              </Tooltip>
            )}
          </FormField>

          {connected && (
            <div className="border-line bg-surface-base flex items-center gap-2 rounded-md border px-3 py-2">
              <p className="text-fg-secondary min-w-0 flex-1 truncate font-mono text-xs">
                {webhookUrl}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={copyWebhookUrl}
                className="text-fg-secondary hover:text-fg h-7 w-7 shrink-0 p-0"
                aria-label="Copy webhook URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="mt-auto flex gap-2 pt-1">
            {editable ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? 'Saving…' : 'Save GitHub settings'}
                </Button>
                {connected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDisconnectOpen(true)}
                    disabled={isSaving}
                    className="text-danger hover:text-danger"
                  >
                    Disconnect
                  </Button>
                )}
              </>
            ) : (
              <>
                <DisabledButtonWithTooltip tooltip="Requires Admin or Owner role">
                  <Button size="sm" disabled className="flex-1 sm:flex-none">
                    Save GitHub settings
                  </Button>
                </DisabledButtonWithTooltip>
                {connected && (
                  <DisabledButtonWithTooltip tooltip="Requires Admin or Owner role">
                    <Button size="sm" variant="outline" disabled>
                      Disconnect
                    </Button>
                  </DisabledButtonWithTooltip>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your GitHub token, repository, branch, and webhook secret. Automated
              commits will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-danger hover:opacity-90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
