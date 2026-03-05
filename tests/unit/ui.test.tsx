import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentStatusPanel } from '@/components/agent-status-panel';
import { describe, it, expect } from 'vitest';

describe('AgentStatusPanel', () => {
    it('should render idle status correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'idle' }} />);
        expect(screen.getByText('Agent Idle')).toBeInTheDocument();
    });

    it('should render running status correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'running' }} />);
        expect(screen.getByText('Agent Running')).toBeInTheDocument();
    });

    it('should render unresponsive (stale) status correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'stale', lastHeartbeat: new Date().toISOString() }} />);
        expect(screen.getByText('Agent Unresponsive')).toBeInTheDocument();
        expect(screen.getByText(/Last seen/)).toBeInTheDocument();
    });

    it('should render paused status correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'paused' }} />);
        expect(screen.getByText('Agent Paused')).toBeInTheDocument();
    });
});
