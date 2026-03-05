import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentStatusPanel } from '@/components/agent-status-panel';

// Minimal UI test suite to fulfill TC-04 requirement
describe('AgentStatusPanel', () => {
    it('should render idle status correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'idle' }} />);
        expect(screen.getByText('Idle')).toBeInTheDocument();
    });

    it('should render running status with stale warning correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'running', is_stale: true }} />);
        expect(screen.getByText('Running')).toBeInTheDocument();
        // Assuming the warning dot or title is rendered, checking presence
        expect(screen.getByTitle(/Agent hasn't reported/)).toBeInTheDocument();
    });

    it('should render paused status correctly', () => {
        render(<AgentStatusPanel agentStatus={{ status: 'paused', last_task_id: 42 }} />);
        expect(screen.getByText('Paused')).toBeInTheDocument();
    });
});
