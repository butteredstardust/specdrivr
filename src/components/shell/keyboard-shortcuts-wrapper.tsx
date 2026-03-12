'use client';

import React from 'react';
import { useShell } from '@/components/providers/shell-provider';
import { KeyboardShortcutsModal } from '@/components/shell/keyboard-shortcuts-modal';

export function KeyboardShortcutsWrapper() {
  const { shortcutsOpen, setShortcutsOpen } = useShell();

  return (
    <KeyboardShortcutsModal
      open={shortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
    />
  );
}
