'use client';

import { useState } from 'react';
import { PlanSelect } from '@/db/schema';
import { createPlanDev, updatePlanDev } from '@/lib/actions';
import type { PlanStatus } from '@/db/schema';

interface InlinePlanEditorProps {
  specId: number;
  plans: PlanSelect[];
  onCreated?: () => void;
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
  fontFamily: "'SF Mono', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
};

const statusColors: Record<PlanStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-ios-gray-6', text: 'text-ios-text-secondary', border: 'border-ios-gray-4' },
  active: { bg: 'bg-ios-blue/10', text: 'text-ios-blue', border: 'border-ios-blue/20' },
  completed: { bg: 'bg-ios-green/10', text: 'text-ios-green', border: 'border-ios-green/20' },
  archived: { bg: 'bg-ios-gray-6', text: 'text-ios-text-secondary', border: 'border-ios-gray-4' },
};

export function InlinePlanEditor({ specId, plans, onCreated }: InlinePlanEditorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the active plan
  const activePlan = plans.find(p => p.status === 'active') || plans[0];

  // Form state
  const [editedJson, setEditedJson] = useState(() => {
    if (activePlan?.architectureDecisions) {
      try {
        return JSON.stringify(activePlan.architectureDecisions, null, 2);
      } catch {
        return '{}';
      }
    }
    return '{\n  "frontend": "Next.js 14 App Router, TypeScript",\n  "backend": "API Routes with Drizzle ORM",\n  "database": "PostgreSQL 16",\n  "styling": "Tailwind CSS"\n}';
  });

  const [selectedStatus, setSelectedStatus] = useState<PlanStatus>(
    (activePlan?.status as PlanStatus) || 'draft'
  );

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Validate JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(editedJson);
      } catch (e) {
        setError('Invalid JSON format');
        setIsSubmitting(false);
        return;
      }

      const status = selectedStatus;

      if (editingPlanId) {
        // Update existing plan
        const result = await updatePlanDev(editingPlanId, parsedJson, status);
        if (result.success) {
          setEditingPlanId(null);
          onCreated?.();
        } else {
          setError(result.error || 'Failed to update plan');
        }
      } else {
        // Create new plan
        const result = await createPlanDev({
          specId,
          architectureDecisions: parsedJson,
          status,
        });
        if (result.success) {
          setIsCreating(false);
          onCreated?.();
        } else {
          setError(result.error || 'Failed to create plan');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPlanId(null);
    setError('');

    // Reset to current active plan
    if (activePlan?.architectureDecisions) {
      try {
        setEditedJson(JSON.stringify(activePlan.architectureDecisions, null, 2));
      } catch {
        setEditedJson('{}');
      }
    }
    setSelectedStatus((activePlan?.status as PlanStatus) || 'draft');
  };

  const handleEdit = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      try {
        setEditedJson(JSON.stringify(plan.architectureDecisions, null, 2));
      } catch {
        setEditedJson('{}');
      }
      setSelectedStatus(plan.status as PlanStatus);
      setEditingPlanId(planId);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(editedJson);
      setEditedJson(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('Cannot format invalid JSON');
    }
  };

  const isCreatingOrEditing = isCreating || editingPlanId !== null;

  return (
    <div className="ios-card shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between ios-font">
          <h2 className="ios-title-3 text-ios-primary ios-font-display">
            Plan
          </h2>
          <div className="flex items-center gap-2">
            {!isCreatingOrEditing && plans.length > 1 && (
              <select
                value={activePlan?.id || ''}
                onChange={(e) => {
                  const planId = parseInt(e.target.value);
                  if (planId) {
                    handleEdit(planId);
                    setEditingPlanId(null);
                  }
                }}
                className="px-3 py-1.5 ios-footnote ios-body ios-radius bg-ios-secondary border border-ios text-ios-primary ios-font-text"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    Plan #{plan.id} ({plan.status})
                  </option>
                ))}
              </select>
            )}
            {!isCreatingOrEditing && (
              <>
                {activePlan && (
                  <button
                    onClick={() => handleEdit(activePlan.id)}
                    className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors"
                  style={{ backgroundColor: 'var(--ios-blue)' }}
                >
                  + New
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-opacity-10 border ios-radius"
            style={{ backgroundColor: 'var(--ios-red)', borderColor: 'var(--ios-separator)' }}
          >
            <p className="ios-footnote text-ios-red ios-font-text">{error}</p>
          </div>
        )}

        {isCreatingOrEditing ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block ios-subheadline text-ios-primary mb-2 ios-font-text">
                Status
              </label>
              <div className="flex gap-2">
                {(Object.keys(statusColors) as PlanStatus[]).map((status) => {
                  const colors = statusColors[status];
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`px-4 py-2 rounded-ios-lg ios-footnote font-medium transition-colors ${selectedStatus === status
                        ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                        : 'bg-ios-gray-6 ios-text-secondary border border-ios-gray-4 hover:bg-ios-gray-5'
                        } ios-font-text`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block ios-subheadline text-ios-primary mb-2 ios-font-text">
                Architecture Decisions (JSON)
              </label>
              <textarea
                value={editedJson}
                onChange={(e) => setEditedJson(e.target.value)}
                rows={16}
                className="font-mono ios-footnote"
                style={{
                  ...iosInputStyle,
                  fontFamily: "'SF Mono', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                }}
                spellCheck={false}
              />
              <p className="mt-2 ios-caption text-ios-placeholder ios-font-text">
                Architecture decisions in JSON format. This describes technical choices, patterns, and structure.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={formatJson}
                className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors"
              >
                Format JSON
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--ios-blue)' }}
                >
                  {isSubmitting ? 'Saving...' : (editingPlanId ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {activePlan?.architectureDecisions ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-ios-xl ios-caption-1 font-medium ${statusColors[activePlan.status as PlanStatus].bg} ${statusColors[activePlan.status as PlanStatus].text} ios-font-text`}>
                    {activePlan.status.charAt(0).toUpperCase() + activePlan.status.slice(1)}
                  </span>
                  <span className="ios-caption text-ios-placeholder ios-font-text">
                    Plan #{activePlan.id}
                  </span>
                </div>
                {Object.entries(activePlan.architectureDecisions as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="bg-ios-secondary rounded-ios-lg p-3">
                    <p className="font-medium text-ios-text-primary ios-body ios-font-text">{key}</p>
                    <p className="ios-footnote text-ios-text-secondary ios-font-text mt-1">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-ios-text-secondary italic ios-body ios-font-text">
                No plan defined. Create one to define architecture decisions.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
