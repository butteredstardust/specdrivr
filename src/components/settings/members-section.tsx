'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { inviteMemberFormSchema, type InviteMemberFormData } from '@/lib/schemas';
import type { UserRole } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { GatedButton } from '@/components/ui/gated-button';
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

  const isAdmin = canAdmin(userRole);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: { email: '', role: 'viewer' },
  });

  const handleInvite = async (values: InviteMemberFormData) => {
    if (!isAdmin) return;
    const email = values.email.trim();

    try {
      // Invitations are created by POSTing to the members collection; there is
      // no /invites route, and posting to one silently 404'd every invite.
      const res = await fetch(`/api/v1/projects/${projectId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: values.role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      toast.success(`Invite sent to ${email}`);
      reset();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to invite member', error);
      toast.error('Failed to send invite');
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
      <section className="border-line bg-surface-raised flex flex-col gap-6 rounded-lg border p-6">
        <h3 className="text-fg text-base font-semibold">Members</h3>

        <div className="border-line overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-line bg-surface-sunken border-b text-left">
                <th className="text-fg-muted px-4 py-2 font-medium">Name</th>
                <th className="text-fg-muted px-4 py-2 font-medium">Email</th>
                <th className="text-fg-muted px-4 py-2 font-medium">Role</th>
                <th className="text-fg-muted px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.userId}
                  className="border-line-subtle hover:bg-surface-inset border-b last:border-0"
                >
                  <td className="text-fg px-4 py-3">{member.name}</td>
                  <td className="text-fg-secondary px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleRoleChange(member.userId, v as UserRole)}
                            disabled={!isAdmin}
                          >
                            <SelectTrigger
                              aria-label={`Role for ${member.name}`}
                              className="h-7 w-28 text-xs"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">
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
                  <td className="px-4 py-3">
                    <GatedButton
                      allowed={isAdmin}
                      reason="Requires admin role to remove"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.userId)}
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 size={14} />
                    </GatedButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite form */}
        <div>
          <h4 className="text-fg mb-3 text-sm font-medium">Invite member</h4>
          <form onSubmit={handleSubmit(handleInvite)} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-fg-secondary text-xs" htmlFor="invite-email">
                Email
              </label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                disabled={!isAdmin}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'invite-email-error' : undefined}
                className="w-64"
                {...register('email')}
              />
              {errors.email && (
                <p id="invite-email-error" className="text-danger text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-fg-secondary text-xs" htmlFor="invite-role">
                Role
              </label>
              {/* Radix Select is not an <input>, so it cannot be registered
                  directly — Controller bridges it to the form state. */}
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!isAdmin}>
                    <SelectTrigger id="invite-role" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <GatedButton
              allowed={isAdmin}
              reason="Requires admin role to invite"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Send invite'}
            </GatedButton>
          </form>
        </div>
      </section>
    </TooltipProvider>
  );
}
