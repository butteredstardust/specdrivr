'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType =
  | 'plan_generated'
  | 'plan_approved'
  | 'plan_rejected'
  | 'changes_requested'
  | 'session_complete'
  | 'task_blocked'
  | 'session_failed'
  | 'member_invited'
  | 'role_changed';

interface PrefState {
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

type PrefsMap = Record<EventType, PrefState>;

interface ApiPref {
  eventType: EventType;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_EVENT_TYPES: EventType[] = [
  'plan_generated',
  'plan_approved',
  'plan_rejected',
  'changes_requested',
  'session_complete',
  'task_blocked',
  'session_failed',
  'member_invited',
  'role_changed',
];

const EVENT_LABELS: Record<EventType, string> = {
  plan_generated: 'Plan generated for my spec',
  plan_approved: 'Plan approved',
  plan_rejected: 'Plan rejected',
  changes_requested: 'Changes requested on my spec',
  session_complete: 'Session complete',
  task_blocked: 'Task blocked (specs I own)',
  session_failed: 'Session failed',
  member_invited: 'Team invitation sent',
  role_changed: 'Role changed',
};

const DEFAULT_PREFS: PrefsMap = Object.fromEntries(
  ALL_EVENT_TYPES.map((et) => [et, { emailEnabled: false, inAppEnabled: true }])
) as PrefsMap;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiArrayToMap(arr: ApiPref[]): PrefsMap {
  const map = { ...DEFAULT_PREFS };
  for (const item of arr) {
    map[item.eventType] = { emailEnabled: item.emailEnabled, inAppEnabled: item.inAppEnabled };
  }
  return map;
}

function isEqual(a: PrefsMap, b: PrefsMap): boolean {
  for (const et of ALL_EVENT_TYPES) {
    if (a[et].emailEnabled !== b[et].emailEnabled) return false;
    if (a[et].inAppEnabled !== b[et].inAppEnabled) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPreferencesSection() {
  const [prefs, setPrefs] = useState<PrefsMap>(DEFAULT_PREFS);
  const initialPrefsRef = useRef<PrefsMap>(DEFAULT_PREFS);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch once via usePolling (stopWhen: () => true stops after first successful load)
  const { isLoading } = usePolling<ApiPref[]>({
    url: '/api/v1/notifications/preferences',
    interval: 60_000,
    stopWhen: () => true,
    onData: (data) => {
      const mapped = apiArrayToMap(data);
      setPrefs(mapped);
      initialPrefsRef.current = mapped;
      setIsDirty(false);
      setLoadError(null);
    },
    onError: (err) => {
      clientLogger.error('Failed to load notification preferences', err);
      setLoadError('Failed to load preferences.');
    },
  });

  void isLoading;

  // Toggle a single switch
  const handleToggle = useCallback(
    (eventType: EventType, field: 'emailEnabled' | 'inAppEnabled', value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [eventType]: { ...prev[eventType], [field]: value } };
        setIsDirty(!isEqual(next, initialPrefsRef.current));
        return next;
      });
    },
    []
  );

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferences = ALL_EVENT_TYPES.map((et) => ({
        eventType: et,
        emailEnabled: prefs[et].emailEnabled,
        inAppEnabled: prefs[et].inAppEnabled,
      }));

      const res = await fetch('/api/v1/notifications/preferences', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }

      // Reset dirty tracking against new baseline
      initialPrefsRef.current = { ...prefs };
      setIsDirty(false);
      toast.success('Preferences saved.');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to save notification preferences', error);
      toast.error('Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <section className="flex flex-col gap-6">
      <p className="text-sm text-[--text-secondary]">Choose when DAEMON notifies you.</p>

      {loadError && <p className="text-sm text-[--status-red]">{loadError}</p>}

      {/* Table header */}
      <div className="grid grid-cols-[1fr_4rem_4rem] items-center gap-2 border-b border-[--border-muted] pb-2">
        <span className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          Event
        </span>
        <span className="text-center font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          Email
        </span>
        <span className="text-center font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          In-App
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-0 divide-y divide-[--border-muted]">
        {ALL_EVENT_TYPES.map((et) => (
          <div key={et} className="grid grid-cols-[1fr_4rem_4rem] items-center gap-2 py-3">
            <span className="text-sm text-[--text-primary]">{EVENT_LABELS[et]}</span>

            <div className="flex justify-center">
              <Switch
                checked={prefs[et].emailEnabled}
                onCheckedChange={(val) => handleToggle(et, 'emailEnabled', val)}
                aria-label={`Email notifications for ${EVENT_LABELS[et]}`}
              />
            </div>

            <div className="flex justify-center">
              <Switch
                checked={prefs[et].inAppEnabled}
                onCheckedChange={(val) => handleToggle(et, 'inAppEnabled', val)}
                aria-label={`In-app notifications for ${EVENT_LABELS[et]}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save row */}
      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
          {isSaving ? 'Saving…' : 'Save Preferences'}
        </Button>
        {isDirty && <span className="text-xs text-[--phosphor-amber]">• Unsaved changes</span>}
      </div>
    </section>
  );
}
