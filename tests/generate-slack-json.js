const payload = {
  projectName: 'Project Alpha',
  specName: 'Payment Integration',
  projectId: 1,
  specId: 2,
  taskId: 105,
  taskName: 'Handle refund flow',
  blockedReason: 'Cannot proceed — refund policy not defined in spec.',
  appUrl: 'http://localhost:3000',
};

function buildTaskBlockedBlocks(payload) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '⚠️ Task Blocked — Action Required' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.taskName || 'Task'}* needs your input before DAEMON can continue.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Reason:* ${payload.blockedReason || 'No reason provided.'}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${payload.projectName} · ${payload.specName}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Unblock Task →' },
          url: `${payload.appUrl}/specs/${payload.specId}?task=${payload.taskId}`,
        },
      ],
    },
  ];
}

console.log(JSON.stringify(buildTaskBlockedBlocks(payload), null, 2));
