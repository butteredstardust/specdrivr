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
  backgroundColor: 'var(--bg-bg-primary)',
  color: 'var(--text-text-primary)',
  borderColor: 'var(--ios-separator)',
  borderRadius: '8px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
};

const statusColors: Record<PlanStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-status-idle-6', text: 'text-text-secondary', border: 'border-status-idle-4' },
  active: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  completed: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/20' },
  archived: { bg: 'bg-status-idle-6', text: 'text-text-secondary', border: 'border-status-idle-4' },
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

  const [intent, setIntent] = useState(activePlan?.intent || '');

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

      if (editingPlanId) {
        // Update existing plan
        const result = await updatePlanDev(editingPlanId, parsedJson, selectedStatus);
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
          status: selectedStatus,
          intent: intent,
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

    if (activePlan?.architectureDecisions) {
      try {
        setEditedJson(JSON.stringify(activePlan.architectureDecisions, null, 2));
      } catch {
        setEditedJson('{}');
      }
    }
    setSelectedStatus((activePlan?.status as PlanStatus) || 'draft');
    setIntent(activePlan?.intent || '');
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
      setIntent(plan.intent || '');
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
    <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between ios-font">
          <h2 className="text-[16px] font-semibold text-ios-primary">Plan</h2>
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
                className="px-3 py-1.5 text-[11px] text-text-tertiary rounded-[8px] bg-ios-secondary border border-ios text-ios-primary"
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
                    className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px] transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 text-[13px] text-white rounded-[8px] transition-colors"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  + New
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-opacity-10 border rounded-[8px]"
            style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--ios-separator)' }}
          >
            <p className="text-[11px] text-status-error">{error}</p>
          </div>
        )}

        {isCreatingOrEditing ? (
          <div className="mt-4 space-y-4">
            {isCreating && (
              <div>
                <label htmlFor="intent-input" className="block text-[12px] text-ios-primary mb-2">Intent</label>
                <input
                  id="intent-input"
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g. Implement user authentication"
                  style={{ ...iosInputStyle, fontFamily: 'inherit' }}
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] text-ios-primary mb-2">Status</label>
              <div className="flex gap-2">
                {(Object.keys(statusColors) as PlanStatus[]).map((status) => {
                  const colors = statusColors[status];
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`px-4 py-2 rounded-ios-lg text-[11px] font-medium transition-colors ${selectedStatus === status
                        ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                        : 'bg-status-idle-6 text-text-secondary border border-status-idle-4 hover:bg-status-idle-5'
                        }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-ios-primary mb-2">Architecture Decisions (JSON)</label>
              <textarea
                value={editedJson}
                onChange={(e) => setEditedJson(e.target.value)}
                rows={16}
                className="font-mono text-[11px]"
                style={{
                  ...iosInputStyle,
                  fontFamily: "'SF Mono', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                }}
                spellCheck={false}
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={formatJson}
                className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]"
              >
                Format JSON
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-[13px] text-white rounded-[8px]"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {isSubmitting ? 'Saving...' : (editingPlanId ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {activePlan?.architectureDecisions ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-ios-xl text-[11px] font-medium ${statusColors[activePlan.status as PlanStatus].bg} ${statusColors[activePlan.status as PlanStatus].text}`}>
                    {activePlan.status.charAt(0).toUpperCase() + activePlan.status.slice(1)}
                  </span>
                  <span className="text-[12px] text-text-tertiary">
                    Plan #{activePlan.id}
                  </span>
                </div>

                {activePlan.intent && (
                  <div className="bg-ios-secondary rounded-ios-lg p-3">
                    <p className="text-[12px] font-semibold text-text-primary mb-1">Intent</p>
                    <p className="text-[13px] text-text-secondary">{activePlan.intent}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(activePlan.architectureDecisions as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="bg-ios-secondary rounded-ios-lg p-3">
                      <p className="font-medium text-text-primary text-[13px]">{key}</p>
                      <p className="text-[11px] text-text-tertiary mt-1">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-text-secondary italic text-[13px]">
                No plan defined. Create one to define architecture decisions.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
