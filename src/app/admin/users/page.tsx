'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type UserRole, userRoleColors, userRoleLabels } from '@/lib/ios-styles';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  // Fetch users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (response.status === 403) {
          router.push('/403');
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update user role');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      );
      setShowRoleDialog(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
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

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update user status');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, isActive: !u.isActive } : u
        )
      );
      setShowDeactivateDialog(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleDialog(true);
  };

  const handleOpenDeactivateDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeactivateDialog(true);
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setError('Username and password are required');
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newUserRole,
          isActive: true,
          isAdmin: newUserRole === 'admin',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      // Add new user to local state
      setUsers((prev) => [...prev, result.user]);
      setShowCreateDialog(false);
      setNewUsername('');
      setNewPassword('');
      setNewUserRole('viewer');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text">
      {/* Header */}
      <header className="sticky top-0 z-30 ios-header border-b border-ios-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="ios-callout text-ios-blue hover:text-ios-blue-dark transition-colors"
                >
                  ← Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto ios-scrollbar bg-ios-bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="ios-title-1 text-ios-text-primary ios-font-display">
                Users
              </h1>
              <p className="ios-body text-ios-text-secondary mt-1">
                Manage team members and access permissions
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              Invite User
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="ios-card p-12 text-center">
              <div className="inline-flex items-center gap-3 ios-body text-ios-text-secondary">
                <div className="w-5 h-5 rounded-full border-2 border-ios-gray-400 border-t-ios-blue animate-spin" />
                Loading users...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="ios-card p-6">
              <div className="flex items-center gap-3 p-3 rounded-md bg-ios-red/10 text-ios-red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          {!loading && !error && users.length > 0 && (
            <div className="ios-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ios-border bg-ios-gray-5">
                    <th className="text-left px-6 py-3 ios-subheadline font-semibold text-ios-text-primary">
                      User
                    </th>
                    <th className="text-left px-6 py-3 ios-subheadline font-semibold text-ios-text-primary">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 ios-subheadline font-semibold text-ios-text-primary">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 ios-subheadline font-semibold text-ios-text-primary">
                      Last Login
                    </th>
                    <th className="text-right px-6 py-3 ios-subheadline font-semibold text-ios-text-primary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleInfo = userRoleColors[user.role];

                    return (
                      <tr key={user.id} className="border-b border-ios-border last:border-0 hover:bg-ios-gray-5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-ios-blue flex items-center justify-center text-white ios-subheadline font-semibold flex-shrink-0">
                              {getInitials(user.username)}
                            </div>
                            <div>
                              <div className="ios-body text-ios-text-primary font-medium">
                                {user.username}
                              </div>
                              <div className="ios-caption-1 text-ios-text-secondary">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenRoleDialog(user)}
                            className={`${roleInfo.bg} ${roleInfo.text} px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-80 transition-opacity`}
                          >
                            {userRoleLabels[user.role]}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-ios-green">
                              <span className="w-2 h-2 rounded-full bg-ios-green" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-ios-text-secondary">
                              <span className="w-2 h-2 rounded-full bg-ios-gray" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 ios-body text-ios-text-secondary">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleOpenRoleDialog(user)}
                            >
                              Edit Role
                            </Button>
                            <Button
                              variant={user.isActive ? 'secondary' : 'danger'}
                              size="small"
                              onClick={() => handleOpenDeactivateDialog(user)}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && users.length === 0 && (
            <div className="ios-card p-12 text-center">
              <div className="text-ios-gray-400 mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="ios-title-3 text-ios-text-primary mb-2">No users found</h3>
              <p className="ios-body text-ios-text-secondary">Create your first user to get started</p>
            </div>
          )}
        </div>
      </main>

      {/* Invite User Dialog */}
      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Invite User"
        size="small"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="username"
              className="ios-input ios-body w-full"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="ios-input ios-body w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
              Role
            </label>
            <select
              className="ios-select ios-body w-full"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
            >
              <option value="viewer">Viewer</option>
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="ios-caption-1 text-ios-text-secondary mt-4">
            The user can log in immediately after their account is created. Give them their password directly.
          </p>
        </div>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        title="Change User Role"
        size="small"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedUser && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ios-blue flex items-center justify-center text-white ios-subheadline font-semibold">
                {getInitials(selectedUser.username)}
              </div>
              <div>
                <div className="ios-body text-ios-text-primary font-medium">
                  {selectedUser.username}
                </div>
                <div className="ios-caption-1 text-ios-text-secondary">
                  Current role: {userRoleLabels[selectedUser.role]}
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
              New Role
            </label>
            <div className="space-y-2">
              {(Object.keys(userRoleLabels) as UserRole[]).map((role) => {
                const roleInfo = userRoleColors[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setNewRole(role)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-md border transition-colors ${newRole === role
                        ? `${roleInfo.bg} ${roleInfo.text} border-ios-blue border-2`
                        : 'bg-ios-bg-card border-ios-border text-ios-text-primary hover:bg-ios-gray-5'
                      }`}
                  >
                    <span className="ios-body font-medium">{userRoleLabels[role]}</span>
                    {newRole === role && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleToggleActive}
        title={selectedUser?.isActive ? 'Deactivate User?' : 'Activate User?'}
        message={
          selectedUser?.isActive
            ? `Are you sure you want to deactivate ${selectedUser?.username || 'this user'}? They will no longer be able to access the platform.`
            : `Are you sure you want to activate ${selectedUser?.username || 'this user'}? They will regain access to the platform.`
        }
        confirmText={selectedUser?.isActive ? 'Deactivate' : 'Activate'}
        variant={selectedUser?.isActive ? 'danger' : 'primary'}
      />
    </div>
  );
}
