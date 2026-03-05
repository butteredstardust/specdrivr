'use client';

import { useState } from 'react';
import { createPlanDev } from '@/lib/actions';

interface CreatePlanDialogProps {
  specId: number;
  onPlanCreated?: (plan: any) => void;
}

const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-bg-primary)',
  color: 'var(--text-text-primary)',
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
    intent: '',
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

      const result = await createPlanDev({
        specId,
        architectureDecisions,
        intent: formData.intent,
        status: formData.status as any,
      });

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to create plan');
      }

      setIsOpen(false);
      setFormData({
        architectureDecisions: '',
        intent: '',
        status: 'draft',
      });
      onPlanCreated?.(result.plan);
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
      intent: '',
      status: 'draft',
    });
    setError('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px] "
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

      <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-xl w-full max-w-lg mx-4 overflow-hidden ios relative z-10">
        <div className="p-6">
          <h2 className="text-[20px] font-semibold text-ios-primary mb-6 ">
            Create New Plan
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border rounded-[8px]" style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--ios-separator)' }}>
              <p className="text-[11px] text-text-tertiary text-status-error" style={iosFontStyle}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={iosFontStyle}>
            <div>
              <p className="text-[13px] text-text-secondary mb-4">
                Creating plan for specification #{specId}
              </p>
            </div>

            <div>
              <label htmlFor="architectureDecisions" className="block text-[12px] text-ios-primary mb-2">
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
              <p className="mt-1 ios-caption text-text-tertiary">
                Enter architecture decisions as JSON object
              </p>
            </div>

            <div>
              <label htmlFor="intent" className="block text-[12px] text-ios-primary mb-2">
                What is your intent with this plan? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="intent"
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                placeholder="E.g., Implement the core authentication flow safely, following best practices."
                rows={3}
                required
                style={{ ...iosInputStyle, resize: 'none' }}
              />
              <p className="mt-1 ios-caption text-text-tertiary">
                Provide overarching guidance or a specific goal.
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-[12px] text-ios-primary mb-2">
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
                className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]  disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
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
