import 'server-only';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z } from 'zod';
import { env } from './env';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const ArchDecisionSchema = z.object({
  title: z.string(), // e.g. "Use PostgreSQL over SQLite"
  rationale: z.string(), // why this decision was made
  tradeoffs: z.string(), // what was given up
});

export type ArchDecision = z.infer<typeof ArchDecisionSchema>;

export const GeneratedPlanSchema = z.object({
  intent: z.string(), // 2-3 sentence summary of the approach
  phaseLabel: z.string(), // e.g. "Phase 1: Foundation"
  architectureDecisions: z.array(ArchDecisionSchema),
  estimatedTotalMinutes: z.number().int(),
});

export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

export const GeneratedTaskSchema = z.object({
  title: z.string(), // short imperative title: "Set up authentication middleware"
  description: z.string(), // detailed instructions for the agent
  filesInvolved: z.array(z.string()), // e.g. ["src/lib/auth.ts", "src/middleware.ts"]
  dependsOnIndex: z.number().int().nullable(), // index in this array of a prerequisite task, null if none
  estimatedMinutes: z.number().int(),
  doneCriteria: z.string(), // how to verify this task is complete
  verifyCommand: z.string().nullable(), // e.g. "pnpm test src/lib/auth.test.ts"
  recommendedModel: z.enum(['flash', 'pro']).default('flash'),
});

export type GeneratedTask = z.infer<typeof GeneratedTaskSchema>;

export const GeneratedTaskListSchema = z.object({
  tasks: z.array(GeneratedTaskSchema),
});

export type GeneratedTaskList = z.infer<typeof GeneratedTaskListSchema>;

// ---------------------------------------------------------------------------
// Gemini Client Configuration
// ---------------------------------------------------------------------------

const planResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: { type: SchemaType.STRING },
    phaseLabel: { type: SchemaType.STRING },
    architectureDecisions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          rationale: { type: SchemaType.STRING },
          tradeoffs: { type: SchemaType.STRING },
        },
        required: ['title', 'rationale', 'tradeoffs'],
      },
    },
    estimatedTotalMinutes: { type: SchemaType.NUMBER },
  },
  required: ['intent', 'phaseLabel', 'architectureDecisions', 'estimatedTotalMinutes'],
};

const taskListResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          filesInvolved: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          dependsOnIndex: { type: SchemaType.NUMBER },
          estimatedMinutes: { type: SchemaType.NUMBER },
          doneCriteria: { type: SchemaType.STRING },
          verifyCommand: { type: SchemaType.STRING },
          recommendedModel: {
            type: SchemaType.STRING,
            enum: ['flash', 'pro'],
          },
        },
        required: [
          'title',
          'description',
          'filesInvolved',
          'dependsOnIndex',
          'estimatedMinutes',
          'doneCriteria',
        ],
      },
    },
  },
  required: ['tasks'],
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export async function generatePlan(
  spec: { name: string; content: string },
  config?: { apiKey?: string | null; model?: string | null }
): Promise<GeneratedPlan> {
  const apiKey = config?.apiKey || env.GEMINI_API_KEY || '';
  const modelName = config?.model || env.GEMINI_MODEL || 'gemini-2.0-flash';
  const genAIClient = new GoogleGenerativeAI(apiKey);

  const model = genAIClient.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: planResponseSchema as import('@google/generative-ai').Schema,
    },
  });

  const systemPrompt = `You are a senior software architect. Given a specification document, produce a 
structured execution plan. Be concise and precise. Focus on what needs to be 
built, not how to run the project.`;

  const userPrompt = `Specification: ${spec.name}

${spec.content}

Produce a structured plan with:
1. A clear intent statement (2-3 sentences)
2. Key architecture decisions with rationale and trade-offs
3. A phase label for this work
4. Estimated total minutes to complete

Return valid JSON matching the schema.`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  const response = result.response;
  const text = response.text();

  try {
    const parsed = JSON.parse(text);
    return GeneratedPlanSchema.parse(parsed);
  } catch {
    console.error('Failed to parse Gemini plan response:', text);
    throw new Error('Invalid plan structure returned from Gemini API');
  }
}

export async function generateTasks(
  spec: { name: string; content: string },
  plan: { markdownContent: string },
  config?: { apiKey?: string | null; model?: string | null }
): Promise<GeneratedTaskList> {
  const apiKey = config?.apiKey || env.GEMINI_API_KEY || '';
  const modelName = config?.model || env.GEMINI_MODEL || 'gemini-2.0-flash';
  const genAIClient = new GoogleGenerativeAI(apiKey);

  const model = genAIClient.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: taskListResponseSchema as import('@google/generative-ai').Schema,
    },
  });

  const systemPrompt = `You are a senior software engineer decomposing a plan into atomic, executable tasks 
for an AI coding agent. Each task must be independently executable by an agent with 
access to the codebase. Tasks must be ordered by dependency — no task should require 
work from a later task.`;

  const estimatedMinutesPerTask = 30; // Example threshold

  const userPrompt = `Specification: ${spec.name}
${spec.content}

Approved Plan Document:
${plan.markdownContent}

Decompose this Approved Plan Document into ordered, atomic tasks for an AI coding agent. Each task should:
- Be completable in under ${estimatedMinutesPerTask} minutes
- Have clear done criteria
- List exact files the agent will need to create or modify
- Specify any prerequisite task by its index (0-based) in this list

Return valid JSON matching the schema.`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  const response = result.response;
  const text = response.text();

  try {
    const parsed = JSON.parse(text);
    return GeneratedTaskListSchema.parse(parsed);
  } catch {
    console.error('Failed to parse Gemini task list response:', text);
    throw new Error('Invalid task list structure returned from Gemini API');
  }
}
