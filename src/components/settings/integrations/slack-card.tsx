'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Hash } from 'lucide-react';
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
  type SlackFields,
} from './shared';

interface SlackCardProps {
  projectId: number;
  editable: boolean;
  initialData: PublicAgentConfig | null;
  onSaved: () => void;
}

export function SlackCard({ projectId, editable, initialData, onSaved }: SlackCardProps) {
  const [form, setForm] = useState<SlackFields>({
    slackBotToken: '',
    slackChannelId: initialData?.slackChannelId ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const connected = Boolean(initialData?.slackBotTokenConfigured && form.slackChannelId);

  const set = <K extends keyof SlackFields>(key: K, value: string) => {
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
          ...(form.slackBotToken.trim() ? { slackBotToken: form.slackBotToken.trim() } : {}),
          slackChannelId: form.slackChannelId.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }
      toast.success('Slack settings saved.');
      onSaved();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to save Slack settings', error);
      toast.error('Failed to save Slack settings');
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
          slackBotToken: null,
          slackChannelId: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }
      setForm({ slackBotToken: '', slackChannelId: '' });
      toast.success('Slack disconnected.');
      onSaved();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to disconnect Slack', error);
      toast.error('Failed to disconnect Slack');
    } finally {
      setIsSaving(false);
      setDisconnectOpen(false);
    }
  };

  return (
    <>
      <Card className="border-line bg-surface-raised h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Hash className="text-fg-secondary size-4" />
            <CardTitle>Slack</CardTitle>
          </div>
          <CardDescription className="text-fg-secondary text-xs">
            Send notifications to Slack.
          </CardDescription>
          <ConnectedBadge connected={connected} />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <FormField label="Bot token" htmlFor="slackBotToken">
            {editable ? (
              <PasswordInput
                id="slackBotToken"
                value={form.slackBotToken}
                onChange={(v) => set('slackBotToken', v)}
                disabled={false}
                placeholder="xoxb-••••••••••••"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <PasswordInput
                      id="slackBotToken"
                      value={form.slackBotToken}
                      onChange={(v) => set('slackBotToken', v)}
                      disabled
                      placeholder="xoxb-••••••••••••"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin or Owner role</TooltipContent>
              </Tooltip>
            )}
          </FormField>

          <FormField label="Channel ID" htmlFor="slackChannelId">
            {editable ? (
              <Input
                id="slackChannelId"
                value={form.slackChannelId}
                onChange={(e) => set('slackChannelId', e.target.value)}
                disabled={false}
                placeholder="C0123456789"
                className="font-mono text-sm"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Input
                      id="slackChannelId"
                      value={form.slackChannelId}
                      onChange={(e) => set('slackChannelId', e.target.value)}
                      disabled
                      placeholder="C0123456789"
                      className="font-mono text-sm"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin or Owner role</TooltipContent>
              </Tooltip>
            )}
          </FormField>

          <div className="mt-auto flex gap-2 pt-1">
            {editable ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? 'Saving…' : 'Save Slack settings'}
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
                    Save Slack settings
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
            <AlertDialogTitle>Disconnect Slack?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your Slack bot token and channel ID. Notifications will stop being
              sent.
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
