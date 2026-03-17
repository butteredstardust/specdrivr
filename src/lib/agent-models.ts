export type AgentBackend = 'gemini' | 'claude';
export type TaskWeight = 'flash' | 'pro';

interface ModelConfig {
  bin: string; // CLI binary name
  lightModel: string; // for flash/simple tasks
  heavyModel: string; // for pro/complex tasks
  flagModel: string; // CLI flag name for --model
  flagPrompt: string; // CLI flag for inline prompt
  extraArgs: string[]; // additional flags always passed
}

export const BACKEND_CONFIG: Record<AgentBackend, ModelConfig> = {
  gemini: {
    bin: 'gemini',
    lightModel: 'gemini-2.0-flash',
    heavyModel: 'gemini-2.0-pro',
    flagModel: '--model',
    flagPrompt: '-p',
    extraArgs: [],
  },
  claude: {
    bin: 'claude',
    lightModel: 'claude-haiku-4-5',
    heavyModel: 'claude-sonnet-4-6',
    flagModel: '--model',
    flagPrompt: '-p',
    extraArgs: ['--output-format', 'json'],
  },
};

export function resolveModel(backend: AgentBackend, weight: TaskWeight): string {
  const config = BACKEND_CONFIG[backend];
  return weight === 'pro' ? config.heavyModel : config.lightModel;
}

export function buildCliArgs(backend: AgentBackend, prompt: string, weight: TaskWeight): string[] {
  const config = BACKEND_CONFIG[backend];
  const model = resolveModel(backend, weight);
  return [config.flagPrompt, prompt, config.flagModel, model, ...config.extraArgs];
}
