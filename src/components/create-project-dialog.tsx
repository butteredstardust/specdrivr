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
      // Parse tech stack JSON if provided
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        onClick={() => setIsOpen(true)}
      >
        + New Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Project</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div>
              <label htmlFor="constitution" className="block text-sm font-medium text-gray-700 mb-1">
                Project Constitution
              </label>
              <textarea
                id="constitution"
                value={formData.constitution}
                onChange={(e) => setFormData({ ...formData, constitution: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the project's purpose..."
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="techStack" className="block text-sm font-medium text-gray-700 mb-1">
                Tech Stack (JSON)
              </label>
              <textarea
                id="techStack"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder='{"language": "TypeScript", "framework": "Next.js"}'
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Enter tech stack as JSON object
              </p>
            </div>

            <div>
              <label htmlFor="basePath" className="block text-sm font-medium text-gray-700 mb-1">
                Base Path
              </label>
              <input
                type="text"
                id="basePath"
                value={formData.basePath}
                onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="/path/to/project"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}