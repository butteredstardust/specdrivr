'use client';

import { useState } from 'react';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
        title={generatedToken ? 'Token Generated' : 'Generate Agent Token'}
        size="small"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              {generatedToken ? 'Done' : 'Cancel'}
            </Button>
            {!generatedToken && (
              <Button onClick={handleGenerate} disabled={!tokenName.trim() || isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            )}
          </div>
        }
      >
        {!generatedToken ? (
          <div className="space-y-4">
            <div className="bg-ios-yellow/10 text-ios-orange-700 ios-caption-1 px-3 py-2 rounded-md border border-ios-yellow/30">
              ⚠️ Warning: Agent tokens provide full API access. Keep them secret and rotate regularly.
            </div>

            <div>
              <label
                htmlFor="token-name"
                className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2"
              >
                Token Name
              </label>
              <input
                id="token-name"
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g.,Production Agent, Claude Opus"
                className="ios-input ios-body w-full"
                disabled={isGenerating}
                maxLength={100}
              />
              <p className="ios-caption-1 text-ios-text-tertiary mt-1">
                Give this token a recognizable name
              </p>
            </div>

            <div>
              <label
                htmlFor="model-hint"
                className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2"
              >
                Primary Model (Optional)
              </label>
              <select
                id="model-hint"
                value={modelHint}
                onChange={(e) => setModelHint(e.target.value)}
                className="ios-select ios-body w-full"
                disabled={isGenerating}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="ios-caption-1 text-ios-text-tertiary mt-1">
                The model this token is primarily configured for
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-ios-green/10 text-ios-green-700 ios-caption-1 px-3 py-2 rounded-md border border-ios-green/30">
              ✓ Token generated successfully. Store it securely - you won't see it again!
            </div>

            <div>
              <label className="ios-caption-1 text-ios-text-primary uppercase tracking-wide block mb-2">
                Your Token
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 ios-card p-3 ios-footnote text-ios-text-primary bg-ios-gray-6 break-all">
                  {generatedToken}
                </code>
                <Button variant="secondary" size="small" onClick={handleCopyToken}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="ios-card p-3 space-y-2 ios-footnote">
              <div className="flex justify-between">
                <span className="text-ios-text-secondary">Name:</span>
                <span className="text-ios-text-primary font-medium">{tokenName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ios-text-secondary">Model:</span>
                <span className="text-ios-text-primary">
                  {modelOptions.find((o) => o.value === modelHint)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ios-text-secondary">Created:</span>
                <span className="text-ios-text-primary">Just now</span>
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
