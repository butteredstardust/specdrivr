'use client';

import React from 'react';

// pxlkit fallback: @pxlkit/ui-kit does not actually export a ToastProvider,
// relying on the existing sonner Toaster in layout.tsx.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
