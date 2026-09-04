'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Github,
  Hash,
  Globe,
  Eye,
  EyeOff,
  Copy,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole, WebhookSelect } from '@/db/schema';
import type { PublicAgentConfig } from '@/lib/agent-config-public';
import { usePolling } from '@/hooks/use-polling';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationsSectionProps {
  projectId: number;
  userRole: UserRole;
}

interface GitHubFields {
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  githubWebhookSecret: string;
}

interface SlackFields {
  slackBotToken: string;
  slackChannelId: string;
}

interface WebhookFormData {
  url: string;
  secret: string;
  events: string[];
}

type PublicWebhook = Omit<WebhookSelect, 'secret'> & { secretConfigured: boolean };

const WEBHOOK_EVENTS = [
  { value: 'task.completed', label: 'task.completed' },
  { value: 'task.failed', label: 'task.failed' },
  { value: 'task.blocked', label: 'task.blocked' },
  { value: 'session.completed', label: 'session.completed' },
  { value: 'session.failed', label: 'session.failed' },
  { value: 'plan.approved', label: 'plan.approved' },
  { value: '*', label: '* (all events)' },
];

const WEBHOOK_FORM_DEFAULTS: WebhookFormData = {
  url: '',
  secret: '',
  events: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

// ---------------------------------------------------------------------------
// PasswordInput — input with show/hide toggle
// ---------------------------------------------------------------------------

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}

function PasswordInput({ id, value, onChange, disabled, placeholder }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="pr-9 font-mono text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShow((prev) => !prev)}
        className="text-fg-secondary hover:text-fg absolute top-1/2 right-1.5 h-6 w-6 -translate-y-1/2 p-0 disabled:pointer-events-none"
        aria-label={show ? 'Hide value' : 'Show value'}
        disabled={disabled}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-fg-secondary font-mono text-xs uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectedBadge
// ---------------------------------------------------------------------------

function ConnectedBadge({ connected }: { connected: boolean }) {
  return (
    <Badge variant={connected ? 'success' : 'muted'} className="font-mono text-[10px]">
      {connected ? 'Connected' : 'Not connected'}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// DisabledButtonWithTooltip
// ---------------------------------------------------------------------------

function DisabledButtonWithTooltip({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{children}</span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// GitHubCard
// ---------------------------------------------------------------------------

interface GitHubCardProps {
  projectId: number;
  editable: boolean;
  initialData: PublicAgentConfig | null;
  onSaved: () => void;
}

function GitHubCard({ projectId, editable, initialData, onSaved }: GitHubCardProps) {
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
      <Card className="border-line bg-surface-raised">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Github className="text-fg-secondary h-5 w-5" />
            <CardTitle className="text-fg text-sm font-semibold">GitHub</CardTitle>
          </div>
          <CardDescription className="text-fg-secondary text-xs">
            Connect your repository for automated commits.
          </CardDescription>
          <ConnectedBadge connected={connected} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField label="GITHUB TOKEN" htmlFor="githubToken">
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

          <FormField label="REPOSITORY" htmlFor="githubRepo">
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

          <FormField label="BRANCH" htmlFor="githubBranch">
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

          <FormField label="WEBHOOK SECRET" htmlFor="githubWebhookSecret">
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

          <div className="flex gap-2 pt-1">
            {editable ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? 'Saving…' : 'Save GitHub Settings'}
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
                    Save GitHub Settings
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
            <AlertDialogAction onClick={handleDisconnect} className="bg-danger hover:bg-danger/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// SlackCard
// ---------------------------------------------------------------------------

interface SlackCardProps {
  projectId: number;
  editable: boolean;
  initialData: PublicAgentConfig | null;
  onSaved: () => void;
}

function SlackCard({ projectId, editable, initialData, onSaved }: SlackCardProps) {
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
      <Card className="border-line bg-surface-raised">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Hash className="text-fg-secondary h-5 w-5" />
            <CardTitle className="text-fg text-sm font-semibold">Slack</CardTitle>
          </div>
          <CardDescription className="text-fg-secondary text-xs">
            Send notifications to Slack.
          </CardDescription>
          <ConnectedBadge connected={connected} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField label="BOT TOKEN" htmlFor="slackBotToken">
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

          <FormField label="CHANNEL ID" htmlFor="slackChannelId">
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

          <div className="flex gap-2 pt-1">
            {editable ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? 'Saving…' : 'Save Slack Settings'}
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
                    Save Slack Settings
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
            <AlertDialogAction onClick={handleDisconnect} className="bg-danger hover:bg-danger/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// WebhookDialog — create / edit
// ---------------------------------------------------------------------------

interface WebhookDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: WebhookFormData) => Promise<void>;
  initial?: WebhookFormData;
  isSaving: boolean;
}

function WebhookDialog({ open, onClose, onSave, initial, isSaving }: WebhookDialogProps) {
  const [form, setForm] = useState<WebhookFormData>(initial ?? WEBHOOK_FORM_DEFAULTS);

  // Sync form when dialog opens with new initial data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm(initial ?? WEBHOOK_FORM_DEFAULTS);
    } else {
      onClose();
    }
  };

  const toggleEvent = (value: string) => {
    setForm((prev) => {
      const has = prev.events.includes(value);
      if (has) {
        return { ...prev, events: prev.events.filter((e) => e !== value) };
      }
      // If selecting *, clear all others; if selecting specific, remove *
      if (value === '*') {
        return { ...prev, events: ['*'] };
      }
      return { ...prev, events: prev.events.filter((e) => e !== '*').concat(value) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xs tracking-widest uppercase">
            {initial?.url ? 'EDIT WEBHOOK' : 'ADD WEBHOOK'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="ENDPOINT URL *" htmlFor="webhookUrl">
            <Input
              id="webhookUrl"
              type="url"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com/hook"
              required
              className="font-mono text-sm"
            />
          </FormField>

          <FormField label="HMAC SECRET (OPTIONAL)" htmlFor="webhookSecret">
            <PasswordInput
              id="webhookSecret"
              value={form.secret}
              onChange={(v) => setForm((prev) => ({ ...prev, secret: v }))}
              disabled={false}
              placeholder="your-secret"
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <Label className="text-fg-secondary font-mono text-xs uppercase">EVENTS</Label>
            <div className="flex flex-col gap-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <div key={ev.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`event-${ev.value}`}
                    checked={form.events.includes(ev.value)}
                    onCheckedChange={() => toggleEvent(ev.value)}
                  />
                  <Label
                    htmlFor={`event-${ev.value}`}
                    className="text-fg-secondary cursor-pointer font-mono text-xs"
                  >
                    {ev.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving || form.events.length === 0}>
              {isSaving ? 'Saving…' : 'Save Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// WebhooksCard
// ---------------------------------------------------------------------------

interface WebhooksCardProps {
  projectId: number;
  editable: boolean;
}

function WebhooksCard({ projectId, editable }: WebhooksCardProps) {
  const [webhooks, setWebhooks] = useState<PublicWebhook[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PublicWebhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublicWebhook | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onData = useCallback((data: PublicWebhook[]) => {
    setWebhooks(data ?? []);
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load webhooks', err);
  }, []);

  const { isLoading, restart } = usePolling<PublicWebhook[]>({
    url: `/api/v1/projects/${projectId}/webhooks`,
    stopWhen: () => true,
    onData,
    onError,
  });

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (wh: PublicWebhook) => {
    setEditTarget(wh);
    setDialogOpen(true);
  };

  const handleSave = async (data: WebhookFormData) => {
    setIsSaving(true);
    try {
      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/v1/projects/${projectId}/webhooks/${editTarget.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: data.url,
            ...(data.secret ? { secret: data.secret } : {}),
            events: data.events,
          }),
        });
      } else {
        res = await fetch(`/api/v1/projects/${projectId}/webhooks`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: data.url,
            secret: data.secret || null,
            events: data.events,
          }),
        });
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }

      toast.success(editTarget ? 'Webhook updated.' : 'Webhook created.');
      setDialogOpen(false);
      restart();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to save webhook', error);
      toast.error('Failed to save webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/webhooks/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }
      toast.success('Webhook deleted.');
      setDeleteTarget(null);
      restart();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to delete webhook', error);
      toast.error('Failed to delete webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const editInitial: WebhookFormData | undefined = editTarget
    ? {
        url: editTarget.url,
        secret: '',
        events: (editTarget.events as string[]) ?? [],
      }
    : undefined;

  return (
    <>
      <Card className="border-line bg-surface-raised">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="text-fg-secondary h-5 w-5" />
            <CardTitle className="text-fg text-sm font-semibold">Webhooks</CardTitle>
          </div>
          <CardDescription className="text-fg-secondary text-xs">
            Send events to external endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Add button */}
          {editable ? (
            <Button size="sm" variant="outline" onClick={openAdd} className="self-start">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Webhook
            </Button>
          ) : (
            <DisabledButtonWithTooltip tooltip="Requires Admin or Owner role">
              <Button size="sm" variant="outline" disabled className="self-start">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Webhook
              </Button>
            </DisabledButtonWithTooltip>
          )}

          {/* Webhook list */}
          {isLoading ? (
            <p className="text-fg-secondary font-mono text-xs">Loading webhooks…</p>
          ) : webhooks.length === 0 ? (
            <p className="text-fg-secondary text-xs">No webhooks configured.</p>
          ) : (
            <div className="divide-line flex flex-col divide-y">
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center gap-2 py-2">
                  <p className="text-fg-secondary min-w-0 flex-1 truncate font-mono text-xs">
                    {wh.url}
                  </p>
                  <Badge
                    variant={wh.status === 'active' ? 'success' : 'danger'}
                    className="font-mono text-[10px]"
                  >
                    {wh.status}
                  </Badge>
                  {editable ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-fg-secondary hover:text-fg h-7 w-7 shrink-0"
                          aria-label="Webhook actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(wh)} className="gap-2">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(wh)}
                          className="text-danger focus:text-danger gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-fg-secondary h-7 w-7 shrink-0"
                              aria-label="Webhook actions"
                              disabled
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Requires Admin or Owner role</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <WebhookDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initial={editInitial}
        isSaving={isSaving}
      />

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{deleteTarget?.url}</span> will be permanently deleted and
              will no longer receive events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-danger hover:bg-danger/90"
            >
              {isSaving ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// IntegrationsSection — root client component
// ---------------------------------------------------------------------------

export function IntegrationsSection({ projectId, userRole }: IntegrationsSectionProps) {
  const editable = canEdit(userRole);

  const [agentConfig, setAgentConfig] = useState<PublicAgentConfig | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  const onData = useCallback((data: PublicAgentConfig | null) => {
    setAgentConfig(data);
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load integrations config', err);
    toast.error('Failed to load integration settings');
  }, []);

  const { isLoading, restart: restartConfig } = usePolling<PublicAgentConfig | null>({
    url: `/api/v1/projects/${projectId}/agent-config`,
    interval: 60_000,
    stopWhen: () => true,
    onData,
    onError,
  });

  // Re-fetch fresh config then force child card re-mounts so state is refreshed
  const handleSaved = useCallback(() => {
    restartConfig();
    setConfigVersion((v) => v + 1);
  }, [restartConfig]);

  if (isLoading) {
    return <p className="text-fg-secondary font-mono text-xs">Loading integrations…</p>;
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GitHubCard
          key={`github-${configVersion}`}
          projectId={projectId}
          editable={editable}
          initialData={agentConfig}
          onSaved={handleSaved}
        />
        <SlackCard
          key={`slack-${configVersion}`}
          projectId={projectId}
          editable={editable}
          initialData={agentConfig}
          onSaved={handleSaved}
        />
        <WebhooksCard projectId={projectId} editable={editable} />
      </div>
    </TooltipProvider>
  );
}
