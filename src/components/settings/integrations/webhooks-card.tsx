'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Globe, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
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
import {
  DisabledButtonWithTooltip,
  FormField,
  PasswordInput,
  WEBHOOK_EVENTS,
  WEBHOOK_FORM_DEFAULTS,
  type PublicWebhook,
  type WebhookFormData,
} from './shared';

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
          <DialogTitle className="text-xs">
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
            <Label className="text-fg-muted text-2xs font-medium">Events</Label>
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

export function WebhooksCard({ projectId, editable }: WebhooksCardProps) {
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
                    className="text-2xs font-mono"
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
