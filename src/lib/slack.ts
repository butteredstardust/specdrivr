import 'server-only';
import { projectRepository } from '@/repositories/project-repository';
import { logger } from './logger';

export type SlackEventType =
  | 'session_started'
  | 'session_completed'
  | 'session_failed'
  | 'task_blocked';

export type SlackEventPayload = {
  projectId: number;
  projectName: string;
  specId?: number;
  specName?: string;
  sessionId?: number;
  taskId?: number;
  taskName?: string;
  blockedReason?: string;
  totalCostUsd?: number;
  appUrl: string; // base URL for deep links
};

/**
 * Retrieve Slack config for a project from agent_config.
 */
export async function getSlackConfig(projectId: number): Promise<{
  botToken: string;
  channelId: string;
} | null> {
  try {
    const config = await projectRepository.getAgentConfig(projectId);

    if (!config || !config.slackBotToken || !config.slackChannelId) {
      return null;
    }

    return {
      botToken: config.slackBotToken,
      channelId: config.slackChannelId,
    };
  } catch (error) {
    logger.error({ error, projectId }, 'Failed to retrieve Slack config');
    return null;
  }
}

/**
 * Store or update Slack config for a project.
 */
export async function setSlackConfig(
  projectId: number,
  config: { botToken: string; channelId: string },
  actorId: string
): Promise<void> {
  try {
    await projectRepository.updateAgentConfig(
      projectId,
      {
        slackBotToken: config.botToken,
        slackChannelId: config.channelId,
      },
      actorId
    );

    logger.info({ projectId, slackConfigured: true }, 'Slack config updated');
  } catch (error) {
    logger.error({ error, projectId }, 'Failed to set Slack config');
    throw error;
  }
}

/**
 * Remove Slack config for a project (disconnect).
 */
export async function removeSlackConfig(projectId: number, actorId: string): Promise<void> {
  try {
    await projectRepository.updateAgentConfig(
      projectId,
      {
        slackBotToken: null,
        slackChannelId: null,
      },
      actorId
    );

    logger.info({ projectId }, 'Slack config removed');
  } catch (error) {
    logger.error({ error, projectId }, 'Failed to remove Slack config');
    throw error;
  }
}

/**
 * Sends a Slack notification for a specific event.
 */
export async function sendSlackNotification(
  projectId: number,
  event: SlackEventType,
  payload: SlackEventPayload
): Promise<void> {
  const config = await getSlackConfig(projectId);
  if (!config) {
    return;
  }

  let blocks: unknown[] = [];
  let fallbackText = '';

  switch (event) {
    case 'session_started':
      blocks = buildSessionStartedBlocks(payload);
      fallbackText = `🚀 Session Started: ${payload.specName || 'New Session'} in ${payload.projectName}`;
      break;
    case 'session_completed':
      blocks = buildSessionCompletedBlocks(payload);
      fallbackText = `✅ Session Complete: ${payload.specName || 'Session'} in ${payload.projectName}`;
      break;
    case 'session_failed':
      blocks = buildSessionFailedBlocks(payload);
      fallbackText = `❌ Session Failed: ${payload.specName || 'Session'} in ${payload.projectName}`;
      break;
    case 'task_blocked':
      blocks = buildTaskBlockedBlocks(payload);
      fallbackText = `⚠️ Task Blocked: ${payload.taskName || 'Action Required'} in ${payload.projectName}`;
      break;
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.botToken}`,
      },
      body: JSON.stringify({
        channel: config.channelId,
        blocks: blocks,
        text: fallbackText,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      logger.error({ error: result.error, projectId, event }, 'Slack notification failed');
    } else {
      logger.info({ projectId, event, slackConfigured: true }, 'Slack notification sent');
    }
  } catch (error: unknown) {
    logger.error({ error, projectId, event }, 'Slack API call failed');
  }
}

function buildSessionStartedBlocks(payload: SlackEventPayload) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🚀 Session Started' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.specName || 'Session'}* — DAEMON is executing your plan.`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Session ${payload.sessionId} · ${payload.projectName}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Session →' },
          url: `${payload.appUrl}/sessions/${payload.sessionId}`,
        },
      ],
    },
  ];
}

function buildSessionCompletedBlocks(payload: SlackEventPayload) {
  const cost = payload.totalCostUsd !== undefined ? `$${payload.totalCostUsd.toFixed(4)}` : 'N/A';
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '✅ Session Complete' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.specName || 'Session'}* — All tasks executed successfully.`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Session ${payload.sessionId} · Cost: ${cost} · ${payload.projectName}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Results →' },
          url: `${payload.appUrl}/specs/${payload.specId}`,
        },
      ],
    },
  ];
}

function buildSessionFailedBlocks(payload: SlackEventPayload) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '❌ Session Failed' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.specName || 'Session'}* — The session encountered an error.`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Session ${payload.sessionId} · ${payload.projectName}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Session →' },
          url: `${payload.appUrl}/sessions/${payload.sessionId}`,
        },
      ],
    },
  ];
}

function buildTaskBlockedBlocks(payload: SlackEventPayload) {
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
