'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
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
import { Monitor, Smartphone, Globe, Loader2 } from 'lucide-react';

interface SessionRow {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionsPayload {
  sessions: SessionRow[];
  currentSessionId: string;
}

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Unknown Browser';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Chromium')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
  return 'Browser';
}

function parseOS(ua: string | null): string {
  if (!ua) return 'Unknown OS';
  if (ua.includes('Windows NT')) return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown OS';
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function isMobile(ua: string | null): boolean {
  if (!ua) return false;
  return (
    ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad') || ua.includes('Mobile')
  );
}

function SessionIcon({ ua }: { ua: string | null }) {
  if (isMobile(ua)) return <Smartphone className="size-4 shrink-0 text-[--text-muted]" />;
  if (!ua) return <Globe className="size-4 shrink-0 text-[--text-muted]" />;
  return <Monitor className="size-4 shrink-0 text-[--text-muted]" />;
}

export function ActiveSessionsSection() {
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const stopWhen = useCallback((data: SessionsPayload) => {
    setSessions(data.sessions);
    setCurrentSessionId(data.currentSessionId);
    return true;
  }, []);

  const { isLoading, error, restart } = usePolling<SessionsPayload>({
    url: '/api/v1/users/me/sessions',
    stopWhen,
  });

  const handleRevoke = async () => {
    if (!revokeTargetId) return;
    setIsRevoking(true);

    try {
      const res = await fetch(`/api/v1/users/me/sessions/${revokeTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      toast.success('Session revoked.');
      setSessions((prev) => prev.filter((s) => s.id !== revokeTargetId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to revoke session', error);
      toast.error('Failed to revoke session.');
    } finally {
      setIsRevoking(false);
      setRevokeTargetId(null);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevoking(true);

    try {
      const res = await fetch('/api/v1/users/me/sessions', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      toast.success('All other sessions revoked.');
      setSessions((prev) => prev.filter((s) => s.id === currentSessionId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to revoke all sessions', error);
      toast.error('Failed to revoke all sessions.');
    } finally {
      setIsRevoking(false);
      setRevokeAllOpen(false);
    }
  };

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
        ACTIVE SESSIONS
      </h2>

      {isLoading && (
        <div className="flex items-center gap-2 text-[--text-muted]">
          <Loader2 className="size-3 animate-spin" />
          <span className="font-mono text-xs">Loading sessions…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[--status-red]">Failed to load sessions.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="h-auto px-0 font-mono text-xs text-[--text-muted] underline hover:bg-transparent hover:text-[--text-primary]"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSessionId;
            const browser = parseBrowser(s.userAgent);
            const os = parseOS(s.userAgent);
            const lastActive = timeAgo(s.updatedAt);

            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded border border-[--surface-border] px-3 py-2.5"
              >
                <SessionIcon ua={s.userAgent} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-mono text-xs text-[--text-primary]">
                    {browser} &middot; {os}
                  </span>
                  <span className="font-mono text-xs text-[--text-muted]">
                    {s.ipAddress ?? 'Unknown IP'} &middot; {lastActive}
                  </span>
                </div>
                {isCurrent ? (
                  <span className="shrink-0 rounded border border-[--phosphor-amber]/40 px-1.5 py-0.5 font-mono text-xs text-[--phosphor-amber]">
                    this session
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 font-mono text-xs text-[--status-red] hover:bg-[--status-red]/10 hover:text-[--status-red]"
                    onClick={() => setRevokeTargetId(s.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            );
          })}

          {otherSessions.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevokeAllOpen(true)}
                className="h-auto px-0 font-mono text-xs text-[--status-red] underline hover:bg-transparent hover:opacity-80"
              >
                Revoke all other sessions
              </Button>
            </div>
          )}

          {sessions.length === 0 && (
            <p className="font-mono text-xs text-[--text-muted]">No active sessions found.</p>
          )}
        </div>
      )}

      {/* Revoke single session dialog */}
      <AlertDialog
        open={!!revokeTargetId}
        onOpenChange={(open) => !open && setRevokeTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">Revoke session?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              This session will be signed out immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-[--status-red] text-white hover:bg-[--status-red]/90"
            >
              {isRevoking ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke all other sessions dialog */}
      <AlertDialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">Revoke all other sessions?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              All sessions except this one will be signed out immediately. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              disabled={isRevoking}
              className="bg-[--status-red] text-white hover:bg-[--status-red]/90"
            >
              {isRevoking ? 'Revoking…' : 'Revoke all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
