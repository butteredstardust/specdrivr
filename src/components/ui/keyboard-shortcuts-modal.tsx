'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useShell } from '@/components/shell/shell-context';

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-[--border-default] bg-[--bg-elevated] px-1.5 py-0.5 font-mono text-xs text-[--text-secondary]">
      {children}
    </kbd>
  );
}

interface ShortcutRowProps {
  keys: React.ReactNode;
  action: string;
}

function ShortcutRow({ keys, action }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[--text-secondary]">{action}</span>
      <div className="flex items-center gap-1">{keys}</div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 mb-1 font-mono text-xs tracking-widest text-[--text-muted] uppercase first:mt-0">
      {children}
    </p>
  );
}

export function KeyboardShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen } = useShell();

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-lg border-[--border-default] bg-[--bg-surface]">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm tracking-widest text-[--text-muted] uppercase">
            KEYBOARD SHORTCUTS
          </DialogTitle>
        </DialogHeader>

        <div className="divide-y divide-[--border-muted]">
          <div className="pb-3">
            <SectionHeader>NAVIGATION</SectionHeader>
            <ShortcutRow
              keys={
                <>
                  <Kbd>G</Kbd>
                  <Kbd>M</Kbd>
                </>
              }
              action="Mission Control"
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd>G</Kbd>
                  <Kbd>S</Kbd>
                </>
              }
              action="Specifications"
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd>G</Kbd>
                  <Kbd>A</Kbd>
                </>
              }
              action="Sessions"
            />
          </div>

          <div className="py-3">
            <SectionHeader>ACTIONS</SectionHeader>
            <ShortcutRow keys={<Kbd>N</Kbd>} action="New specification" />
            <ShortcutRow
              keys={
                <>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </>
              }
              action="Command palette"
            />
          </div>

          <div className="py-3">
            <SectionHeader>TASK LIST</SectionHeader>
            <ShortcutRow
              keys={
                <>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </>
              }
              action="Move focus"
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd>Enter</Kbd>
                  <Kbd>Space</Kbd>
                </>
              }
              action="Expand / collapse"
            />
            <ShortcutRow keys={<Kbd>O</Kbd>} action="Open Task Drawer" />
          </div>

          <div className="pt-3">
            <SectionHeader>SYSTEM</SectionHeader>
            <ShortcutRow
              keys={
                <>
                  <Kbd>Ctrl</Kbd>
                  <Kbd>`</Kbd>
                </>
              }
              action="Toggle Dev Mode"
            />
            <ShortcutRow keys={<Kbd>?</Kbd>} action="This help dialog" />
            <ShortcutRow keys={<Kbd>Esc</Kbd>} action="Close drawer / dialog" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
