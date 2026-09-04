'use client';

import { SectionHeading } from './shared';

export function TokenSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>Agent token</SectionHeading>

      <div className="border-line bg-surface-raised rounded-md border p-4">
        <p className="text-fg-muted text-2xs font-medium">Agent token</p>
        <p className="text-fg mt-2 font-mono text-sm">sdk_••••••••••••</p>
        <p className="text-fg-muted mt-1 text-xs">
          This token is set via environment variable. Rotate it in your infrastructure, then update
          AGENT_TOKEN.
        </p>
      </div>
    </section>
  );
}
