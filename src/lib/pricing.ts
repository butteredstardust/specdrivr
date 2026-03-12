// import 'server-only';

/**
 * LLM pricing table — USD per 1M tokens.
 * Update when Anthropic publishes new pricing.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':         { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':       { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':        { input: 0.25,  output: 1.25  },
  // Fallback for any unrecognised model string
  'default':                 { input: 3.00,  output: 15.00 },
};

/**
 * Compute USD cost for a single LLM call.
 * Returns a number with up to 6 decimal places of precision.
 *
 * @param model      Model string e.g. "claude-sonnet-4-6"
 * @param inputTokens   Number of prompt/input tokens
 * @param outputTokens  Number of completion/output tokens
 */
export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PRICING[model] ?? PRICING['default'];
  const cost = (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  // Round to 6 decimal places to avoid floating point noise
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Returns the display string for a cost value, e.g. "$0.003412"
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  if (usd < 1)    return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}
