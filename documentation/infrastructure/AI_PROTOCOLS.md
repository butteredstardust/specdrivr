**SPECDRIVR**

Master Product Specification — AI Protocols & Schemas

[Status: GROUND TRUTH]

---

## 1. Overview

This document defines the interface between Specdrivr and Large Language Models (LLMs) used for both high-level planning and task-level execution.

## 2. Plan Generation Protocol (Gemini / Claude)

### 2.1 System Prompt Structure
The system prompt for plan generation must include:
1. **Context**: The project's tech stack and current repository structure.
2. **Goal**: Transform a user's Markdown specification into a list of atomic, dependency-ordered tasks.
3. **Constraints**:
    - Tasks must be independent where possible (enabling parallel execution).
    - Tasks must include clear "Done Criteria" and optional "Verify Command."
    - Output must be valid JSON.

### 2.2 Output JSON Schema
```json
{
  "intent": "Brief summary of the proposed implementation",
  "architecture_decisions": [
    {
      "decision": "Add a new column to the users table",
      "rationale": "Required for onboarding status tracking"
    }
  ],
  "tasks": [
    {
      "externalId": "T-001",
      "title": "Database migration for users table",
      "description": "Create a migration to add onboarding_step (integer) and onboarding_complete (boolean) to the users table.",
      "doneCriteria": "Users table has the new columns in the schema.",
      "verifyCommand": "pnpm db:check-schema",
      "dependsOn": [],
      "recommendedModel": "flash"
    }
  ]
}
```

## 3. Agent Task Protocol

### 3.1 Task Execution Prompt
When the DAEMON agent executes a task, it wraps the task description in this template:
```markdown
You are an AI coding agent executing a specific task within the Specdrivr ecosystem.

PROJECT: {{projectName}}
SPECIFICATION: {{specName}}

### YOUR TASK: {{taskTitle}}
{{taskDescription}}

### FILES TO MODIFY:
{{filesInvolved}}

### DONE CRITERIA:
{{doneCriteria}}

### VERIFY COMMAND:
{{verifyCommand}}

### ADDITIONAL CONTEXT:
{{humanContext}}

### INSTRUCTIONS:
1. Analyze the existing codebase for patterns and styles.
2. Make minimal, surgical changes to fulfill the task.
3. Ensure all new code is properly typed (TypeScript).
4. Do not delete existing functionality unless explicitly asked.
```

## 4. Agent Cost Extraction (Claude / LLM Output)
When using the Claude backend, the DAEMON agent is designed to extract usage costs directly from the LLM output to provide real-time visibility.
- **Mechanism**: The agent regex-parses the **last JSON block** within the LLM's full output.
- **Expected Key**: `cost_usd` (numeric).
- **Fallback**: If no valid JSON is found or the key is missing, the agent reports `$0.00` and relies on the server's nightly pricing-table calculation.

## 5. Model Selection & Weighting
The `recommendedModel` field in the generated Plan determines the `TaskWeight` used by the agent:

| **Plan ID** | **TaskWeight** | **Target Backend**         |
| ----------- | -------------- | -------------------------- |
| `flash`     | `flash`        | Gemini 2.0 Flash / Haiku   |
| `pro`       | `pro`          | Gemini 2.0 Pro / Sonnet 3.5 |

