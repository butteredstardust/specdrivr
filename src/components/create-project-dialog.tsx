'use client';

import { useState } from 'react';
import { createProject } from '@/lib/actions';
import { ProjectSelect } from '@/db/schema';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  onProjectCreated?: (project: ProjectSelect) => void;
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
        setFormData({ name: '', constitution: '', techStack: '', basePath: '' });
        onProjectCreated?.(result.project);
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

  const inputClasses = "w-full px-[var(--sp-3)] py-[var(--sp-2)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-colors placeholder:text-[var(--color-text-tertiary)]";

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        icon={<Plus size={14} />}
        className="w-full justify-start"
      >
        New Project
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={handleCancel}
        title="Create New Project"
        size="medium"
        footer={
          <>
            <Button variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim()}
              loading={isSubmitting}
            >
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-[var(--sp-4)]">
          {error && (
            <div className="p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border-l-4 border-[var(--color-text-danger)] rounded-[var(--radius-sm)]">
              <p className="text-[12px] text-[var(--color-text-danger)] font-medium">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-[12px] font-semibold text-[var(--color-text-secondary)] mb-[var(--sp-1)]">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClasses}
              placeholder="e.g. My Website Migration"
              required
            />
          </div>

          <div>
            <label htmlFor="constitution" className="block text-[12px] font-semibold text-[var(--color-text-secondary)] mb-[var(--sp-1)]">
              Project Constitution (Instructions)
            </label>
            <textarea
              id="constitution"
              value={formData.constitution}
              onChange={(e) => setFormData({ ...formData, constitution: e.target.value })}
              className={cn(inputClasses, "resize-none h-[80px]")}
              placeholder="Provide high-level guidelines for the agent..."
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--sp-4)]">
            <div>
              <label htmlFor="techStack" className="block text-[12px] font-semibold text-[var(--color-text-secondary)] mb-[var(--sp-1)]">
                Tech Stack (JSON)
              </label>
              <textarea
                id="techStack"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className={cn(inputClasses, "resize-none h-[120px] font-mono text-[12px]")}
                placeholder='{"lang": "TS"}'
              />
            </div>
            <div>
              <label htmlFor="basePath" className="block text-[12px] font-semibold text-[var(--color-text-secondary)] mb-[var(--sp-1)]">
                Base Path
              </label>
              <input
                type="text"
                id="basePath"
                value={formData.basePath}
                onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                className={inputClasses}
                placeholder="/Users/dev/project"
              />
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1.5 leading-relaxed">
                Absolute path where the agent will perform operations.
              </p>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
