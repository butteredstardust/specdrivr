'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
interface ArchiveProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isArchived: boolean;
}
export function ArchiveProjectDialog({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isArchived,
}: ArchiveProjectDialogProps) {
  const [projectNameInput, setProjectNameInput] = useState('');
  const isNameMatch = projectNameInput.trim() === projectName;
  const title = isArchived ? "Unarchive Project?" : "Archive Project?";
  const message = isArchived
    ? "This will restore the project to the dashboard and make it visible again."
    : "This will archive the project and hide it from the dashboard. You can unarchive it later from settings.";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={true}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isArchived ? "primary" : "danger"}
            onClick={onConfirm}
            disabled={!isNameMatch}
          >
            {isArchived ? "Unarchive" : "Archive Project"}
          </Button>
        </>
      }
    >
      <div className="space-y-[var(--sp-6)]">
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">{message}</p>

        <div className="space-y-[var(--sp-2)]">
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Type "{projectName}" to confirm
          </label>
          <input
            type="text"
            value={projectNameInput}
            onChange={(e) => setProjectNameInput(e.target.value)}
            className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-all placeholder:text-[var(--color-text-tertiary)]"
            placeholder={projectName}
          />
          {!isNameMatch && projectNameInput && (
            <p className="text-[12px] font-medium text-[var(--color-text-danger)] mt-[var(--sp-1)]">
              Project name does not match
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
