'use client';

import { useState } from 'react';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Copy, Key, ChevronDown } from 'lucide-react';

interface GenerateTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenGenerated?: (name: string, model?: string) => Promise<void>;
}

export function GenerateTokenDialog({ isOpen, onClose, onTokenGenerated }: GenerateTokenDialogProps) {
  const [tokenName, setTokenName] = useState('');
  const [modelHint, setModelHint] = useState('claude-opus-4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleGenerate = async () => {
    if (!tokenName.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate token generation - in production, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a random token (demo only - in production, the server would generate this)
      const newToken = `sk-agent-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedToken(newToken);

      if (onTokenGenerated) {
        await onTokenGenerated(tokenName, modelHint);
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (generatedToken && !showConfirmDialog) {
      // Warn user if they have a generated token they haven't copied
      setShowConfirmDialog(true);
      return;
    }
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setTokenName('');
    setModelHint('claude-opus-4');
    setGeneratedToken(null);
    setShowConfirmDialog(false);
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
    }
  };

  const modelOptions = [
    { value: 'claude-opus-4', label: 'Claude Opus 4' },
    { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
    { value: 'claude-haiku-4', label: 'Claude Haiku 4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title={generatedToken ? 'Token Created' : 'Generate Agent Token'}
        size="small"
        footer={
          <div className="flex items-center justify-end gap-[var(--sp-2)]">
            <Button variant="secondary" onClick={handleClose}>
              {generatedToken ? 'Done' : 'Cancel'}
            </Button>
            {!generatedToken && (
              <Button variant="primary" onClick={handleGenerate} disabled={!tokenName.trim() || isGenerating} loading={isGenerating}>
                Generate Token
              </Button>
            )}
          </div>
        }
      >
        {!generatedToken ? (
          <div className="space-y-[var(--sp-6)]">
            <div className="bg-[#FFF7E6] text-[#824400] text-[13px] p-[var(--sp-3)] rounded-[var(--radius-sm)] border border-[#FFE3B3] flex gap-[var(--sp-3)]">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <p>Agent tokens provide full API access. Keep them secret and rotate them regularly for security.</p>
            </div>

            <div className="space-y-[var(--sp-2)]">
              <label
                htmlFor="token-name"
                className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]"
              >
                Token Name
              </label>
              <input
                id="token-name"
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g. Production CI/CD"
                className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                disabled={isGenerating}
                maxLength={100}
              />
              <p className="text-[12px] text-[var(--text-tertiary)] italic">
                A descriptive name to identify where this token is used.
              </p>
            </div>

            <div className="space-y-[var(--sp-2)]">
              <label
                htmlFor="model-hint"
                className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]"
              >
                Primary Model (Optional)
              </label>
              <div className="relative">
                <select
                  id="model-hint"
                  value={modelHint}
                  onChange={(e) => setModelHint(e.target.value)}
                  className="w-full h-[40px] pl-[var(--sp-3)] pr-[var(--sp-10)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all appearance-none cursor-pointer"
                  disabled={isGenerating}
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-[var(--sp-6)]">
            <div className="bg-[#E3FCEF] text-[#006644] text-[13px] p-[var(--sp-3)] rounded-[var(--radius-sm)] border border-[#ABF5D1] flex gap-[var(--sp-3)]">
              <span className="mt-0.5 shrink-0">✓</span>
              <p>Token generated successfully. Store it securelly — it won't be shown again.</p>
            </div>

            <div className="space-y-[var(--sp-2)]">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Access Token
              </label>
              <div className="flex gap-[var(--sp-2)]">
                <div className="flex-1 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-[var(--sp-3)] font-mono text-[12px] text-[var(--text-primary)] break-all select-all">
                  {generatedToken}
                </div>
                <Button variant="secondary" size="small" onClick={handleCopyToken}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-[var(--sp-4)] space-y-[var(--sp-2)] shadow-[var(--shadow-card)]">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[var(--text-tertiary)] font-bold uppercase tracking-wide">Name</span>
                <span className="text-[var(--text-primary)] font-semibold">{tokenName}</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[var(--text-tertiary)] font-bold uppercase tracking-wide">Model</span>
                <span className="text-[var(--text-primary)]">
                  {modelOptions.find((o) => o.value === modelHint)?.label}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[var(--text-tertiary)] font-bold uppercase tracking-wide">Created</span>
                <span className="text-[var(--text-primary)]">Now</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleReset();
          onClose();
        }}
        title="Discard Generated Token?"
        message="You have a generated token that you haven't copied. If you close this dialog without copying, you'll need to generate a new token."
        confirmText="Discard & Close"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
