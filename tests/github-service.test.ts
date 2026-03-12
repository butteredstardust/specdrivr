import { describe, it, expect } from 'vitest';
import { getAgentBranchName, getAgentCommitMessage, verifyGitHubToken } from '../src/lib/github';

describe('GitHub Service', () => {
  it('should generate correct agent branch name', () => {
    const branch = getAgentBranchName('spec_001', 'task_103');
    expect(branch).toBe('daemon/spec-spec_001/task-task_103');
  });

  describe('getAgentCommitMessage', () => {
    it('should generate correct commit message for normal title', () => {
      const msg = getAgentCommitMessage('T-042', 'Implement checkout flow');
      expect(msg).toBe('feat(T-042): Implement checkout flow');
    });

    it('should truncate long titles to keep total under 72 chars', () => {
      const longTitle = 'A'.repeat(200);
      const msg = getAgentCommitMessage('T-042', longTitle);
      expect(msg.length).toBeLessThanOrEqual(72);
      expect(msg).toMatch(/^feat\(T-042\): A+\.\.\.$/);
    });

    it('should handle very long externalId', () => {
        const longId = '1234567890'.repeat(10); // 100 chars
        const msg = getAgentCommitMessage(longId, 'Title');
        expect(msg.length).toBe(72);
        expect(msg.startsWith('feat(T-1234567890')).toBe(true);
    });
  });

  it('should return invalid for incorrect token', async () => {
    const result = await verifyGitHubToken('invalid-token');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
