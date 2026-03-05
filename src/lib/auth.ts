import { NextRequest } from 'next/server';

/**
 * Validate X-Agent-Token header for API authentication
 */
export function validateAgentToken(request: NextRequest): boolean {
  const token = request.headers.get('x-agent-token');
  const expectedToken = process.env.AGENT_TOKEN;

  return !!(token && expectedToken && token === expectedToken);
}


/**
 * Get error response for unauthorized access
 */
export function getUnauthorizedResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing X-Agent-Token header',
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
