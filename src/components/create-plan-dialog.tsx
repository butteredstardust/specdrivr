'use client';

import { useState } from 'react';
import { createPlanDev } from '@/lib/actions';

interface CreatePlanDialogProps {
  specId: number;
  onPlanCreated?: (plan: any) => void;
}

const inputClass = "w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-all";
const textareaClass = "w-full p-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-all resize-none";
const labelClass = "block text-[var(--font-size-xs)] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]";

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
        className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-[var(--brand-primary)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hovered)] transition-colors"
      >
        Create Plan
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleCancel}
      />

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] w-full max-w-lg mx-[var(--sp-4)] overflow-hidden relative z-10">
        <div className="p-[var(--sp-6)]">
          <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--text-primary)] mb-[var(--sp-6)]">
            Create New Plan
          </h2>

          {error && (
            <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--status-blocked-bg)] border border-[var(--status-blocked-text)] rounded-[var(--radius-sm)]">
              <p className="text-[var(--font-size-xs)] text-[var(--status-blocked-text)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[var(--sp-4)]">
            <div>
              <p className="text-[var(--font-size-sm)] text-[var(--text-secondary)] mb-[var(--sp-4)]">
                Creating plan for specification #{specId}
              </p>
            </div>

            <div>
              <label htmlFor="architectureDecisions" className={labelClass}>Architecture Decisions</label>
              <textarea
                id="architectureDecisions"
                value={formData.architectureDecisions}
                onChange={(e) => setFormData({ ...formData, architectureDecisions: e.target.value })}
                placeholder='{"frontend": "Next.js 14", "backend": "API Routes"}'
                rows={6}
                className={`${textareaClass} font-mono`}
              />
              <p className="mt-[var(--sp-1)] text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                Enter architecture decisions as JSON object
              </p>
            </div>

            <div>
              <label htmlFor="intent" className={labelClass}>
                What is your intent with this plan? <span className="text-[var(--status-blocked-text)]">*</span>
              </label>
              <textarea
                id="intent"
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                placeholder="E.g., Implement the core authentication flow safely, following best practices."
                rows={3}
                required
                className={textareaClass}
              />
              <p className="mt-[var(--sp-1)] text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                Provide overarching guidance or a specific goal.
              </p>
            </div>

            <div>
              <label htmlFor="status" className={labelClass}>Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div className="flex justify-end gap-[var(--sp-3)] pt-[var(--sp-4)]">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-[var(--brand-primary)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hovered)] disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-white bg-[var(--brand-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors disabled:opacity-50"
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
