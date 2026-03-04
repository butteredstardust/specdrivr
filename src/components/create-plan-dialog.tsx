'use client';

import { useState } from 'react';
import { db } from '@/db';
import { plans } from '@/db/schema';

interface CreatePlanDialogProps {
  specId: number;
  onPlanCreated?: (plan: any) => void;
}

const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--ios-bg-primary)',
  color: 'var(--ios-text-primary)',
  borderColor: 'var(--ios-separator)',
  borderRadius: '8px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica, sans-serif',
};

const iosFontStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, Helvetica, sans-serif',
};

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
        className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text"
      >
        Create Plan
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ios-font">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      <div className="ios-card shadow-xl w-full max-w-lg mx-4 overflow-hidden ios relative z-10">
        <div className="p-6">
          <h2 className="ios-title-2 text-ios-primary mb-6 ios-font-display">
            Create New Plan
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border ios-radius" style={{ backgroundColor: 'var(--ios-red)', borderColor: 'var(--ios-separator)' }}>
              <p className="text-sm text-ios-red" style={iosFontStyle}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={iosFontStyle}>
            <div>
              <p className="ios-body text-ios-secondary mb-4">
                Creating plan for specification #{specId}
              </p>
            </div>

            <div>
              <label htmlFor="architectureDecisions" className="block ios-subheadline text-ios-primary mb-2">
                Architecture Decisions
              </label>
              <textarea
                id="architectureDecisions"
                value={formData.architectureDecisions}
                onChange={(e) => setFormData({ ...formData, architectureDecisions: e.target.value })}
                placeholder='{"frontend": "Next.js 14", "backend": "API Routes"}'
                rows={6}
                style={{ ...iosInputStyle, resize: 'none', fontFamily: 'monospace, Menlo, Monaco, Consolas, monospace' }}
              />
              <p className="mt-1 ios-caption text-ios-placeholder">
                Enter architecture decisions as JSON object
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block ios-subheadline text-ios-primary mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={iosInputStyle}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors disabled:opacity-50"
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
