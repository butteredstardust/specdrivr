'use client';

import { useState } from 'react';
import { PlanSelect } from '@/db/schema';
import { createPlanDev, updatePlanDev } from '@/lib/actions';
import type { PlanStatus } from '@/db/schema';
import { Button } from './ui/button';
import { Plus, Edit, Save, X, Code, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlinePlanEditorProps {
  specId: number;
  plans: PlanSelect[];
  onCreated?: () => void;
}

const statusLozengeStyles: Record<PlanStatus, string> = {
  draft: 'bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]',
  active: 'bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)]',
  completed: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  archived: 'bg-[var(--bg-sunken)] text-[var(--text-tertiary)]',
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
      let parsedJson;
      try {
        parsedJson = JSON.parse(editedJson);
      } catch {
        setError('Invalid JSON format');
        setIsSubmitting(false);
        return;
      }

      if (editingPlanId) {
        const result = await updatePlanDev(editingPlanId, parsedJson, selectedStatus);
        if (result.success) {
          setEditingPlanId(null);
          onCreated?.();
        } else {
          setError(result.error || 'Failed to update plan');
        }
      } else {
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
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  const isCreatingOrEditing = isCreating || editingPlanId !== null;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-[var(--sp-6)] py-[var(--sp-3)] border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--color-bg-primary)]">
        <div className="flex items-center gap-[var(--sp-4)]">
          <h3 className="text-[14px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Plan</h3>
          {!isCreatingOrEditing && plans.length > 1 && (
            <div className="relative group">
              <select
                value={activePlan?.id || ''}
                onChange={(e) => {
                  const planId = parseInt(e.target.value);
                  if (planId) { handleEdit(planId); setEditingPlanId(null); }
                }}
                className="appearance-none bg-[var(--bg-sunken)] border border-[var(--border-default)] h-[28px] pl-3 pr-8 rounded-[var(--radius-sm)] text-[12px] font-bold text-[var(--brand-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-all cursor-pointer"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>Plan #{plan.id}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--brand-primary)]" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-[var(--sp-2)]">
          {!isCreatingOrEditing ? (
            <>
              {activePlan && (
                <Button variant="secondary" size="small" onClick={() => handleEdit(activePlan.id)} icon={<Edit size={14} />}>
                  Edit
                </Button>
              )}
              <Button variant="primary" size="small" onClick={() => setIsCreating(true)} icon={<Plus size={16} />}>
                New Plan
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-[var(--sp-2)]">
              <Button variant="ghost" size="small" onClick={handleCancel} disabled={isSubmitting} icon={<X size={14} />}>
                Cancel
              </Button>
              <Button variant="primary" size="small" onClick={handleSave} loading={isSubmitting} icon={<Save size={14} />}>
                {editingPlanId ? 'Update' : 'Create'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-[var(--sp-6)]">
        {error && (
          <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--bg-sunken)] border-l-4 border-[var(--status-blocked-text)] rounded-[var(--radius-sm)]">
            <p className="text-[12px] text-[var(--status-blocked-text)] font-medium">{error}</p>
          </div>
        )}

        {isCreatingOrEditing ? (
          <div className="space-y-[var(--sp-5)] max-w-4xl">
            {isCreating && (
              <div>
                <label htmlFor="intent" className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]">Intent</label>
                <input
                  id="intent"
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g. Implement user authentication"
                  className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]">Status</label>
              <div className="flex gap-[var(--sp-2)]">
                {(Object.keys(statusLozengeStyles) as PlanStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "px-[var(--sp-4)] py-[var(--sp-2)] rounded-[var(--radius-sm)] text-[12px] font-bold uppercase transition-all border",
                      selectedStatus === status
                        ? cn("border-[var(--border-focus)] ring-2 ring-[var(--border-focus)] ring-opacity-20", statusLozengeStyles[status])
                        : "bg-[var(--bg-sunken)] border-[var(--border-default)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hovered)]"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-[var(--sp-2)]">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Architecture Decisions (JSON)</label>
                <Button variant="ghost" size="small" onClick={() => { try { setEditedJson(JSON.stringify(JSON.parse(editedJson), null, 2)); } catch { setError('Cannot format invalid JSON'); } }} icon={<Code size={14} />}>
                  Format
                </Button>
              </div>
              <textarea
                value={editedJson}
                onChange={(e) => setEditedJson(e.target.value)}
                rows={12}
                className="w-full p-[var(--sp-4)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] font-mono text-[12px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                spellCheck={false}
              />
            </div>
          </div>
        ) : activePlan && activePlan.status ? (
          <div className="space-y-[var(--sp-6)]">
            <div className="flex items-center gap-[var(--sp-3)]">
              <span className={cn("px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-bold uppercase", statusLozengeStyles[activePlan.status as PlanStatus])}>
                {activePlan.status}
              </span>
              <span className="text-[13px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">Plan #{activePlan.id}</span>
            </div>

            {activePlan.intent && (
              <div className="p-[var(--sp-4)] bg-[var(--bg-sunken)] border-l-4 border-[var(--brand-primary)] rounded-[var(--radius-sm)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Intent</p>
                <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{activePlan.intent}</p>
              </div>
            )}

            {activePlan?.architectureDecisions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-4)]">
                {Object.entries(activePlan.architectureDecisions as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="p-[var(--sp-4)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-card)]">
                    <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{key}</p>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{String(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-[var(--sp-12)] border-2 border-dashed border-[var(--border-default)] rounded-[var(--radius-lg)] opacity-60">
                <CheckCircle2 size={32} className="text-[var(--border-default)] mb-[var(--sp-3)]" />
                <p className="text-[14px] text-[var(--text-secondary)] italic">No plan defined yet.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
