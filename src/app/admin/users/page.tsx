'use client';

import { useState } from 'react';
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // Demo users - in production, fetch from API
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'admin',
      avatarId: 1,
      avatarUrl: null,
      role: 'admin',
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000),
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      username: 'developer1',
      avatarId: 2,
      avatarUrl: null,
      role: 'developer',
      isActive: true,
      lastLoginAt: new Date(Date.now() - 86400000),
      createdAt: new Date('2024-02-15'),
    },
    {
      id: 3,
      username: 'viewer1',
      avatarId: 3,
      avatarUrl: null,
      role: 'viewer',
      isActive: true,
      lastLoginAt: new Date(Date.now() - 172800000),
      createdAt: new Date('2024-03-01'),
    },
  ]);

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

  const handleRoleChange = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      );
      setShowRoleDialog(false);
      setSelectedUser(null);
    }
  };

  const handleToggleActive = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, isActive: !u.isActive } : u
        )
      );
      setShowDeactivateDialog(false);
      setSelectedUser(null);
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

          {/* Users Table */}
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
            <Button onClick={() => setShowCreateDialog(false)}>
              Send Invite
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              className="ios-input ios-body w-full"
            />
          </div>
          <div>
            <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
              Role
            </label>
            <select className="ios-select ios-body w-full">
              <option value="viewer">Viewer</option>
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="ios-caption-1 text-ios-text-secondary">
            An email invitation will be sent to the user with instructions to set up their account.
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-md border transition-colors ${
                      newRole === role
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
