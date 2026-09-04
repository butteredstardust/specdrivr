'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DangerZoneSectionProps {
  project: {
    id: number;
    name: string;
  };
  userRole: UserRole;
}

function canDelete(role: UserRole): boolean {
  return role === 'owner';
}

export function DangerZoneSection({ project, userRole }: DangerZoneSectionProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deletable = canDelete(userRole);

  const handleDelete = async () => {
    if (!deletable) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      toast.success('Project deleted');
      router.push('/projects');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to delete project', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="border-danger-border rounded border p-4">
        <h3 className="text-danger mb-3 text-xs">Danger Zone</h3>
        <div className="flex items-center justify-between gap-4">
          <p className="text-fg-muted font-mono text-xs">
            Permanently delete this project and all its data.
          </p>
          {deletable ? (
            <>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete Project
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-mono">Delete project?</DialogTitle>
                    <DialogDescription className="font-mono text-xs">
                      This action cannot be undone. All specs, sessions, and data for{' '}
                      <strong>{project.name}</strong> will be permanently deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="destructive" size="sm" disabled>
                    Delete Project
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Only project owners can delete</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
