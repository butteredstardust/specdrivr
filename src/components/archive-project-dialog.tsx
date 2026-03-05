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
            {isArchived ? "Unarchive" : "Archive"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[13px] text-text-secondary">{message}</p>

        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-text-secondary">
            Type "{projectName}" to confirm:
          </label>
          <input
            type="text"
            value={projectNameInput}
            onChange={(e) => setProjectNameInput(e.target.value)}
            className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors text-[12px]"
            placeholder={projectName}
          />
          {!isNameMatch && projectNameInput && (
            <p className="ios-caption text-status-error">
              Name must match exactly
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
