'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';

interface Member {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

interface MembersSectionProps {
  projectId: number;
  userRole: UserRole;
}

const ROLE_OPTIONS: UserRole[] = ['viewer', 'member', 'admin', 'owner'];

function canAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

export function MembersSection({ projectId, userRole }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const isAdmin = canAdmin(userRole);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const payload: Member[] = json.data ?? json;
      setMembers(payload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to fetch members', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin || !inviteEmail.trim()) return;
    setIsInviting(true);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole('viewer');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to invite member', error);
      toast.error('Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
      toast.success('Role updated');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to update role', error);
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success('Member removed');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to remove member', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <TooltipProvider>
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">MEMBERS</h2>

        {isLoading ? (
          <p className="font-mono text-xs text-[--text-muted]">Loading members…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[--border] text-left">
                  <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                    Name
                  </th>
                  <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                    Email
                  </th>
                  <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                    Role
                  </th>
                  <th className="pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-b border-[--border]">
                    <td className="py-3 pr-4 font-mono text-[--text-primary]">{member.name}</td>
                    <td className="py-3 pr-4 font-mono text-[--text-secondary]">{member.email}</td>
                    <td className="py-3 pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleRoleChange(member.userId, v as UserRole)}
                              disabled={!isAdmin}
                            >
                              <SelectTrigger className="h-7 w-28 font-mono text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                  <SelectItem key={r} value={r} className="font-mono text-xs">
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </span>
                        </TooltipTrigger>
                        {!isAdmin && <TooltipContent>Requires admin role to change</TooltipContent>}
                      </Tooltip>
                    </td>
                    <td className="py-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!isAdmin}
                              onClick={() => handleRemove(member.userId)}
                              aria-label={`Remove ${member.name}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!isAdmin && <TooltipContent>Requires admin role to remove</TooltipContent>}
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invite form */}
        <div className="mt-2">
          <p className="mb-2 font-mono text-xs tracking-widest text-[--text-muted] uppercase">
            Invite member
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    className="font-mono text-xs text-[--text-secondary]"
                    htmlFor="invite-email"
                  >
                    Email
                  </label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={!isAdmin}
                    className="w-56"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="font-mono text-xs text-[--text-secondary]"
                    htmlFor="invite-role"
                  >
                    Role
                  </label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as UserRole)}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger id="invite-role" className="h-10 w-28 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r} className="font-mono text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" size="sm" disabled={!isAdmin || isInviting}>
                  {isInviting ? 'Sending…' : 'Invite'}
                </Button>
              </form>
            </TooltipTrigger>
            {!isAdmin && <TooltipContent>Requires admin role to invite</TooltipContent>}
          </Tooltip>
        </div>
      </section>
    </TooltipProvider>
  );
}
