'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface MemberWithUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  joinedAt: Date | null;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

interface MembersSectionProps {
  projectId: number;
  userRole: UserRole;
  initialMembers: MemberWithUser[];
}

const ROLE_OPTIONS: UserRole[] = ['viewer', 'member', 'admin', 'owner'];

function canAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

function toMember(m: MemberWithUser): Member {
  return {
    userId: m.id,
    name: m.name ?? '',
    email: m.email ?? '',
    role: m.role,
  };
}

export function MembersSection({ projectId, userRole, initialMembers }: MembersSectionProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(() => initialMembers.map(toMember));
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const isAdmin = canAdmin(userRole);

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
      router.refresh();
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
      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to remove member', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <TooltipProvider>
      <section className="flex flex-col gap-4">
        <h2 className="text-fg-muted text-2xs font-medium">Members</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-line border-b text-left">
                <th className="text-fg-muted pr-4 pb-2 font-normal">Name</th>
                <th className="text-fg-muted pr-4 pb-2 font-normal">Email</th>
                <th className="text-fg-muted pr-4 pb-2 font-normal">Role</th>
                <th className="text-fg-muted pb-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userId} className="border-line border-b">
                  <td className="text-fg py-3 pr-4 font-mono">{member.name}</td>
                  <td className="text-fg-secondary py-3 pr-4 font-mono">{member.email}</td>
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

        {/* Invite form */}
        <div className="mt-2">
          <p className="text-fg-muted mb-2 text-xs">Invite member</p>
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-fg-secondary font-mono text-xs" htmlFor="invite-email">
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
              <label className="text-fg-secondary font-mono text-xs" htmlFor="invite-role">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isAdmin || isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? 'Sending…' : 'Invite'}
                  </Button>
                </span>
              </TooltipTrigger>
              {!isAdmin && <TooltipContent>Requires admin role to invite</TooltipContent>}
            </Tooltip>
          </form>
        </div>
      </section>
    </TooltipProvider>
  );
}
