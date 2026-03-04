'use client';

import { useState } from 'react';
import { db } from '@/db';
import { plans } from '@/db/schema';

interface CreatePlanDialogProps {
  specId: number;
  onPlanCreated?: (plan: any) => void;
}

export function CreatePlanDialog({ specId, onPlanCreated }: CreatePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    architectureDecisions: '',
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Parse architecture decisions JSON
      let architectureDecisions = {};
      if (formData.architectureDecisions.trim()) {
        try {
          architectureDecisions = JSON.parse(formData.architectureDecisions);
        } catch {
          setError('Invalid JSON in architecture decisions field');
          setIsSubmitting(false);
          return;
        }
      }

      // Create plan using DB insert
      const [plan] = await db
        .insert(plans)
        .values({
          specId,
          architectureDecisions,
          status: formData.status as any,
        })
        .returning();

      if (!plan) {
        throw new Error('Failed to create plan');
      }

      setIsOpen(false);
      setFormData({
        architectureDecisions: '',
        status: 'draft',
      });
      onPlanCreated?.(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      architectureDecisions: '',
      status: 'draft',
    });
    setError('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md transition-colors"
      >
        Create Plan
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Plan</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Creating plan for specification #{specId}
              </p>
            </div>

            <div>
              <label htmlFor="architectureDecisions" className="block text-sm font-medium text-gray-700 mb-1">
                Architecture Decisions (JSON)
              </label>
              <textarea
                id="architectureDecisions"
                value={formData.architectureDecisions}
                onChange={(e) => setFormData({ ...formData, architectureDecisions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder='{"frontend": "Next.js 14", "backend": "API Routes"}'
                rows={6}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter architecture decisions as JSON object
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
