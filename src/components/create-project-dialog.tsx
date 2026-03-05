'use client';

import { useState } from 'react';
import { createProject } from '@/lib/actions';
import { ProjectSelect } from '@/db/schema';

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
        setFormData({
          name: '',
          constitution: '',
          techStack: '',
          basePath: '',
        });
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
    setFormData({
      name: '',
      constitution: '',
      techStack: '',
      basePath: '',
    });
    setError('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 active:opacity-80"
        style={{ backgroundColor: '#0071E3' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ios-font">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog Content */}
      <div className="ios-card shadow-xl w-full max-w-md mx-4 overflow-hidden ios">
        <div className="p-6">
          <h2 className="ios-title-2 text-ios-primary mb-6 ios-font-display">
            Create New Project
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border ios-radius" style={{ backgroundColor: 'var(--ios-red)', borderColor: 'var(--ios-separator)' }}>
              <p className="ios-footnote text-ios-red ios-font-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 ios-font-text">
            <div>
              <label htmlFor="name" className="block ios-subheadline text-ios-primary mb-1">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 ios-radius border border-ios bg-ios-primary text-ios-primary ios-font-text focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)] focus:border-[var(--ios-blue)] transition-shadow"
                placeholder="My Awesome Project"
                required
                style={{
                  backgroundColor: 'var(--ios-bg-primary)',
                  color: 'var(--ios-text-primary)',
                  borderColor: 'var(--ios-separator)',
                }}
              />
            </div>

            <div>
              <label htmlFor="constitution" className="block ios-subheadline text-ios-primary mb-1">
                Project Constitution
              </label>
              <textarea
                id="constitution"
                value={formData.constitution}
                onChange={(e) => setFormData({ ...formData, constitution: e.target.value })}
                className="w-full px-3 py-2 ios-radius border border-ios bg-ios-primary text-ios-primary ios-font-text focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)] focus:border-[var(--ios-blue)] transition-shadow resize-none"
                placeholder="Brief description of the project's purpose..."
                rows={3}
                style={{
                  backgroundColor: 'var(--ios-bg-primary)',
                  color: 'var(--ios-text-primary)',
                  borderColor: 'var(--ios-separator)',
                }}
              />
            </div>

            <div>
              <label htmlFor="techStack" className="block ios-subheadline text-ios-primary mb-1">
                Tech Stack (JSON)
              </label>
              <textarea
                id="techStack"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="w-full px-3 py-2 ios-radius border border-ios bg-ios-primary text-ios-primary ios-font-text font-mono ios-footnote focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)] focus:border-[var(--ios-blue)] transition-shadow resize-none"
                placeholder='{"language": "TypeScript", "framework": "Next.js"}'
                rows={3}
                style={{
                  backgroundColor: 'var(--ios-bg-primary)',
                  color: 'var(--ios-text-primary)',
                  borderColor: 'var(--ios-separator)',
                }}
              />
              <p className="mt-1 ios-caption text-ios-placeholder">
                Optional: Enter tech stack as JSON object
              </p>
            </div>

            <div>
              <label htmlFor="basePath" className="block ios-subheadline text-ios-primary mb-1">
                Base Path
              </label>
              <input
                type="text"
                id="basePath"
                value={formData.basePath}
                onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                className="w-full px-3 py-2 ios-radius border border-ios bg-ios-primary text-ios-primary ios-font-text font-mono ios-footnote focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)] focus:border-[var(--ios-blue)] transition-shadow"
                placeholder="/path/to/project"
                style={{
                  backgroundColor: 'var(--ios-bg-primary)',
                  color: 'var(--ios-text-primary)',
                  borderColor: 'var(--ios-separator)',
                }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-[17px] font-medium text-ios-blue bg-ios-secondary border border-ios ios-radius transition-colors ios-font-text disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-[17px] font-medium text-white ios-radius transition-colors ios-font-text disabled:opacity-50"
                disabled={isSubmitting || !formData.name.trim()}
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
