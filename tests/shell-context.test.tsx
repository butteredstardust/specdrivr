// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { ShellProvider, useShell } from '@/components/shell/shell-context';
import { Button } from '@/components/ui/button';

// Mock next/navigation — not available in jsdom
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

function TestConsumer() {
  const { activeProjectId, setActiveProjectId, devMode } = useShell();
  return (
    <div>
      <span data-testid="project-id">{activeProjectId ?? 'null'}</span>
      <span data-testid="dev-mode">{devMode ? 'true' : 'false'}</span>
      <Button onClick={() => setActiveProjectId(42)}>set project</Button>
    </div>
  );
}

describe('ShellContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  test('provides default null activeProjectId', () => {
    render(
      <ShellProvider user={mockUser}>
        <TestConsumer />
      </ShellProvider>
    );
    expect(screen.getByTestId('project-id').textContent).toBe('null');
  });

  test('persists activeProjectId to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider user={mockUser}>
        <TestConsumer />
      </ShellProvider>
    );
    await user.click(screen.getByText('set project'));
    expect(localStorage.getItem('specdrivr:activeProjectId')).toBe('42');
  });

  test('throws if useShell called outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow();
    spy.mockRestore();
  });
});
