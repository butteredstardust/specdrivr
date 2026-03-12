'use client';

import React from 'react';
import { PixelModal, PixelTable, PixelKbd } from '@pxlkit/ui-kit';

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <PixelModal open={open} title="KEYBOARD SHORTCUTS" onClose={onClose}>
      <PixelTable
        columns={[{ key: 'keys', header: 'Keys' }, { key: 'action', header: 'Action' }]}
        data={[
          { keys: <><PixelKbd>?</PixelKbd></>, action: 'Show this dialog' },
          { keys: <><PixelKbd>Ctrl</PixelKbd>+<PixelKbd>`</PixelKbd></>, action: 'Toggle Dev Mode' },
          { keys: <><PixelKbd>G</PixelKbd> then <PixelKbd>M</PixelKbd></>, action: 'Mission Control' },
          { keys: <><PixelKbd>G</PixelKbd> then <PixelKbd>S</PixelKbd></>, action: 'Specifications' },
          { keys: <><PixelKbd>G</PixelKbd> then <PixelKbd>A</PixelKbd></>, action: 'Sessions' },
          { keys: <><PixelKbd>Esc</PixelKbd></>, action: 'Close modal / drawer' },
        ]}
      />
    </PixelModal>
  );
}
