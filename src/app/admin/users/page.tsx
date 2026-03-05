'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type UserRole, userRoleColors, userRoleLabels } from '@/lib/ios-styles';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Plus, MoreHorizontal, User as UserIcon, Shield, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  avatarId: number;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('viewer');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 401) { router.push('/auth/login'); return; }
        if (response.status === 403) { router.push('/403'); return; }
        throw new Error('Failed to fetch users');
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch users');
      setUsers(result.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (username: string) => username.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setShowRoleDialog(false);
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !selectedUser.isActive }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: !u.isActive } : u));
      setShowDeactivateDialog(false);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) return;
    setCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newUserRole, isActive: true, isAdmin: newUserRole === 'admin' }),
      });
      if (!response.ok) throw new Error('Failed to create user');
      const result = await response.json();
      setUsers(prev => [...prev, result.user]);
      setShowCreateDialog(false);
      setNewUsername(''); setNewPassword('');
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const inputClasses = "w-full h-[32px] px-[var(--sp-2)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-colors placeholder:text-[var(--color-text-tertiary)]";

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-[var(--sp-6)]">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">User Management</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">Add users and manage their roles</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateDialog(true)} icon={<Plus size={16} />}>
          Add User
        </Button>
      </div>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border-default)]">
              <th className="text-left px-[var(--sp-4)] py-[var(--sp-3)] text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">User</th>
              <th className="text-left px-[var(--sp-4)] py-[var(--sp-3)] text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Role</th>
              <th className="text-left px-[var(--sp-4)] py-[var(--sp-3)] text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-left px-[var(--sp-4)] py-[var(--sp-3)] text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Last Login</th>
              <th className="text-right px-[var(--sp-4)] py-[var(--sp-3)] text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-[var(--color-border-default)] last:border-0 hover:bg-[var(--color-bg-hovered)] group transition-colors">
                <td className="px-[var(--sp-4)] py-[var(--sp-4)]">
                  <div className="flex items-center gap-[var(--sp-3)]">
                    <div className="w-[32px] h-[32px] rounded-full bg-[var(--color-brand-bold)] flex items-center justify-center text-white text-[12px] font-bold">
                      {getInitials(user.username)}
                    </div>
                    <span className="text-[14px] font-medium text-[var(--color-text-primary)]">{user.username}</span>
                  </div>
                </td>
                <td className="px-[var(--sp-4)] py-[var(--sp-4)]">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-bold uppercase tracking-wide",
                    user.role === 'admin' ? "bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]" : "bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-[var(--sp-4)] py-[var(--sp-4)]">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-[12px] font-medium",
                    user.isActive ? "text-[var(--status-inprogress-text)]" : "text-[var(--color-text-tertiary)]"
                  )}>
                    <span className={cn("w-2 h-2 rounded-full", user.isActive ? "bg-[var(--status-inprogress-text)]" : "bg-[var(--color-text-tertiary)]")} />
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-[var(--sp-4)] py-[var(--sp-4)] text-[12px] text-[var(--color-text-tertiary)]">
                  {formatDate(user.lastLoginAt)}
                </td>
                <td className="px-[var(--sp-4)] py-[var(--sp-4)] text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="small" onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleDialog(true); }}>
                      Edit Role
                    </Button>
                    <Button variant={user.isActive ? 'ghost' : 'secondary'} size="small" onClick={() => { setSelectedUser(user); setShowDeactivateDialog(true); }}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Invite New User"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateUser} disabled={creatingUser || !newUsername || !newPassword}>Create User</Button>
          </>
        }
      >
        <div className="space-y-[var(--sp-4)]">
          <div>
            <label className="block text-[12px] font-bold text-[var(--color-text-secondary)] uppercase mb-1.5">Username</label>
            <input className={inputClasses} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. jdoe" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[var(--color-text-secondary)] uppercase mb-1.5">Password</label>
            <input type="password" className={inputClasses} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[var(--color-text-secondary)] uppercase mb-1.5">Role</label>
            <select className={inputClasses} value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}>
              <option value="viewer">Viewer</option>
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        title="Update User Role"
        footer={<Button variant="primary" onClick={handleRoleChange}>Save Changes</Button>}
      >
        <div className="flex flex-col gap-[var(--sp-3)]">
          {(['viewer', 'developer', 'admin'] as UserRole[]).map(r => (
            <button
              key={r}
              onClick={() => setNewRole(r)}
              className={cn(
                "flex items-center justify-between p-[var(--sp-3)] border rounded-[var(--radius-sm)] transition-all",
                newRole === r
                  ? "bg-[var(--color-bg-selected)] border-[var(--color-border-selected)] text-[var(--color-brand-bold)] font-semibold"
                  : "bg-[var(--color-bg-sunken)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hovered)]"
              )}
            >
              <span className="capitalize">{r}</span>
              {newRole === r && <Shield size={16} />}
            </button>
          ))}
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleToggleActive}
        title={selectedUser?.isActive ? "Deactivate User?" : "Activate User?"}
        message={`Are you sure you want to ${selectedUser?.isActive ? 'deactivate' : 'activate'} ${selectedUser?.username}?`}
        variant={selectedUser?.isActive ? "danger" : "primary"}
      />
    </AppShell>
  );
}
