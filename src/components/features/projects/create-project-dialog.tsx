'use client';

import { useState, useEffect } from 'react';
import { createProject } from '@/lib/actions';
import { ProjectSelect } from '@/db/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming it's added or we just use native if not
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Using sonner as requested in optimistic UI section

interface CreateProjectDialogProps {
  onProjectCreated?: (project: ProjectSelect) => void;
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-new-project-modal', handleOpen);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('newProject') === 'true') {
        setIsOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    return () => window.removeEventListener('open-new-project-modal', handleOpen);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    constitution: '',
    techStack: '',
    basePath: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let techStack: Record<string, unknown> | undefined;
      if (formData.techStack.trim()) {
        try {
          techStack = JSON.parse(formData.techStack);
        } catch {
          setError('Invalid JSON in tech stack field');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await createProject({
        name: formData.name.trim(),
        constitution: formData.constitution || undefined,
        techStack,
        basePath: formData.basePath || undefined,
      });

      if (result.success && result.project) {
        toast.success('Project created successfully');
        setIsOpen(false);
        setFormData({ name: '', constitution: '', techStack: '', basePath: '' });
        onProjectCreated?.(result.project);
        // Dispatch event so layout can refresh project list
        window.dispatchEvent(new CustomEvent('project-created'));
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({ name: '', constitution: '', techStack: '', basePath: '' });
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 border-l-4 border-destructive rounded-sm">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. My Website Migration"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="constitution">Project Constitution (Instructions)</Label>
            <textarea
              id="constitution"
              value={formData.constitution}
              onChange={(e) => setFormData({ ...formData, constitution: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Provide high-level guidelines for the agent..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="techStack">Tech Stack (JSON)</Label>
              <textarea
                id="techStack"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
                placeholder='{"lang": "TS"}'
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePath">Base Path</Label>
              <Input
                id="basePath"
                value={formData.basePath}
                onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                placeholder="/Users/dev/project"
              />
              <p className="text-xs text-muted-foreground">
                Absolute path where the agent will perform operations.
              </p>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel} disabled={isSubmitting} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
