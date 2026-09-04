'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { UserRole, WebhookSelect } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Shared building blocks for the integration cards.
 *
 * These were declared at the top of a single 1,161-line
 * `integrations-section.tsx` alongside the three cards that use them. They are
 * moved here unchanged so each card can be read on its own.
 */

export interface GitHubFields {
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  githubWebhookSecret: string;
}

export interface SlackFields {
  slackBotToken: string;
  slackChannelId: string;
}

export interface WebhookFormData {
  url: string;
  secret: string;
  events: string[];
}

export type PublicWebhook = Omit<WebhookSelect, 'secret'> & { secretConfigured: boolean };

export const WEBHOOK_EVENTS = [
  { value: 'task.completed', label: 'task.completed' },
  { value: 'task.failed', label: 'task.failed' },
  { value: 'task.blocked', label: 'task.blocked' },
  { value: 'session.completed', label: 'session.completed' },
  { value: 'session.failed', label: 'session.failed' },
  { value: 'plan.approved', label: 'plan.approved' },
  { value: '*', label: '* (all events)' },
];

export const WEBHOOK_FORM_DEFAULTS: WebhookFormData = {
  url: '',
  secret: '',
  events: [],
};

export function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

// ---------------------------------------------------------------------------

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  ariaInvalid,
  ariaDescribedBy,
}: PasswordInputProps) {
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
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
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

export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-fg-secondary text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectedBadge
// ---------------------------------------------------------------------------

export function ConnectedBadge({ connected }: { connected: boolean }) {
  return (
    <Badge variant={connected ? 'success' : 'muted'}>
      {connected ? 'Connected' : 'Not connected'}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// DisabledButtonWithTooltip
// ---------------------------------------------------------------------------

export function DisabledButtonWithTooltip({
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
