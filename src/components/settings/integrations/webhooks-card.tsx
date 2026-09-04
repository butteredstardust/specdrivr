'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Globe, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import { webhookFormSchema } from '@/lib/schemas';
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
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: initial ?? WEBHOOK_FORM_DEFAULTS,
  });

  // `defaultValues` is captured on the first render only, and the parent opens
  // this dialog by flipping the `open` prop directly — Radix does not call
  // `onOpenChange` for that transition, so resetting from there would leave the
  // previous webhook's URL and events on screen (and save them over the new
  // one). Reacting to `open`/`initial` is what actually catches every open.
  useEffect(() => {
    if (open) {
      reset(initial ?? WEBHOOK_FORM_DEFAULTS);
    }
  }, [open, initial, reset]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  // `*` means "everything", so it is mutually exclusive with the specific events
  // rather than just another entry in the list.
  const toggleEvent = (events: string[], value: string): string[] => {
    if (events.includes(value)) {
      return events.filter((e) => e !== value);
    }
    if (value === '*') {
      return ['*'];
    }
    return events.filter((e) => e !== '*').concat(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.url ? 'Edit webhook' : 'Add webhook'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
          <FormField label="Endpoint URL *" htmlFor="webhookUrl">
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://example.com/hook"
              aria-invalid={Boolean(errors.url)}
              aria-describedby={errors.url ? 'webhook-url-error' : undefined}
              className="font-mono text-sm"
              {...register('url')}
            />
          </FormField>
          {errors.url && (
            <p id="webhook-url-error" className="text-danger text-xs">
              {errors.url.message}
            </p>
          )}

          <FormField label="HMAC secret (optional)" htmlFor="webhookSecret">
            <Controller
              name="secret"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="webhookSecret"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={false}
                  placeholder="your-secret"
                  ariaInvalid={Boolean(errors.secret)}
                  ariaDescribedBy={errors.secret ? 'webhook-secret-error' : undefined}
                />
              )}
            />
          </FormField>
          {errors.secret && (
            <p id="webhook-secret-error" className="text-danger text-xs">
              {errors.secret.message}
            </p>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-fg text-sm font-medium">Events</legend>
            {/* A checkbox group is one field holding an array, so it is driven
                through a single Controller rather than per-box registration. */}
            <Controller
              name="events"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <div key={ev.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`event-${ev.value}`}
                        checked={field.value.includes(ev.value)}
                        onCheckedChange={() => field.onChange(toggleEvent(field.value, ev.value))}
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
              )}
            />
            {errors.events && <p className="text-danger text-xs">{errors.events.message}</p>}
          </fieldset>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save webhook'}
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

  // The dialog resets its form whenever this changes, and polling re-renders
  // this component every few seconds — a fresh object literal each time would
  // wipe out whatever the user is typing.
  const editInitial: WebhookFormData | undefined = useMemo(
    () =>
      editTarget
        ? {
            url: editTarget.url,
            secret: '',
            events: (editTarget.events as string[]) ?? [],
          }
        : undefined,
    [editTarget]
  );

  return (
    <>
      <Card className="border-line bg-surface-raised h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="text-fg-secondary size-4" />
            <CardTitle>Webhooks</CardTitle>
          </div>
          <CardDescription className="text-fg-secondary text-xs">
            Send events to external endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          {/* Add button */}
          {editable ? (
            <Button size="sm" variant="outline" onClick={openAdd} className="self-start">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add webhook
            </Button>
          ) : (
            <DisabledButtonWithTooltip tooltip="Requires Admin or Owner role">
              <Button size="sm" variant="outline" disabled className="self-start">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add webhook
              </Button>
            </DisabledButtonWithTooltip>
          )}

          {/* Webhook list */}
          {isLoading ? (
            <p className="text-fg-secondary text-xs">Loading webhooks…</p>
          ) : webhooks.length === 0 ? (
            <p className="text-fg-secondary text-xs">No webhooks configured.</p>
          ) : (
            <div className="divide-line flex flex-col divide-y">
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center gap-2 py-2">
                  <p className="text-fg-secondary min-w-0 flex-1 truncate font-mono text-xs">
                    {wh.url}
                  </p>
                  <Badge variant={wh.status === 'active' ? 'success' : 'danger'}>{wh.status}</Badge>
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
              className="bg-danger hover:opacity-90"
            >
              {isSaving ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
