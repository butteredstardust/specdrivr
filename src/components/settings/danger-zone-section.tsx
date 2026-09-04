'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { GatedButton } from '@/components/ui/gated-button';
import { TooltipProvider } from '@/components/ui/tooltip';
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
      <section className="border-danger-border bg-danger-bg flex max-w-2xl flex-col gap-4 rounded-lg border p-6">
        <h3 className="text-danger text-base font-semibold">Delete project</h3>
        <div className="flex items-center justify-between gap-4">
          <p className="text-fg-secondary text-sm">
            Permanently delete this project and all its data.
          </p>
          {deletable ? (
            <>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete project
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete project?</DialogTitle>
                    <DialogDescription>
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
            <GatedButton
              allowed={false}
              reason="Only project owners can delete"
              variant="destructive"
              size="sm"
            >
              Delete project
            </GatedButton>
          )}
        </div>
      </section>
    </TooltipProvider>
  );
}
