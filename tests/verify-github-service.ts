import { getAgentBranchName, getAgentCommitMessage, verifyGitHubToken } from '../src/lib/github';

async function test() {
  console.log('Testing getAgentBranchName...');
  const branch = getAgentBranchName('spec_001', 'task_103');
  console.log(`Branch: ${branch} (Expected: daemon/spec-spec_001/task-task_103)`);

  console.log('\nTesting getAgentCommitMessage...');
  const msg1 = getAgentCommitMessage('T-042', 'Implement checkout flow');
  console.log(`Msg1: ${msg1} (Expected: feat(T-042): Implement checkout flow)`);

  const longTitle = 'A'.repeat(200);
  const msg2 = getAgentCommitMessage('T-042', longTitle);
  console.log(`Msg2 length: ${msg2.length} (Expected: <= 72)`);
  console.log(`Msg2: ${msg2}`);

  console.log('\nTesting verifyGitHubToken (invalid)...');
  const result = await verifyGitHubToken('invalid-token');
  console.log(`Result: ${JSON.stringify(result)} (Expected valid: false)`);
}

test().catch(console.error);
