'use client';

import { SectionHeading } from './shared';

export function TokenSection() {
  return (
    <section className="border-line bg-surface-raised flex flex-col gap-4 rounded-lg border p-6">
      <SectionHeading>Agent token</SectionHeading>

      <div className="bg-surface-sunken rounded-md p-4">
        <p className="text-fg font-mono text-sm">sdk_••••••••••••</p>
        <p className="text-fg-muted mt-1 text-xs">
          This token is set via environment variable. Rotate it in your infrastructure, then update
          AGENT_TOKEN.
        </p>
      </div>
    </section>
  );
}
