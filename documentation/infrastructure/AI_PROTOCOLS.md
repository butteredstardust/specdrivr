SPECDRIVR

Master Product Specification — AI Protocols & Schemas

---

## 1. Overview

Use this document to implement the interface between Specdrivr and large language models (LLMs). It defines plan generation and task execution.

## 2. Plan Generation Protocol (Gemini / Claude)

### 2.1 System Prompt Structure

Include these items in the plan-generation system prompt:

1. **Context**: The project tech stack and current repository structure.
2. **Goal**: Transform a user Markdown specification into independent tasks in dependency order.
3. **Constraints**:
   - Keep tasks independent where possible. This enables parallel execution.
   - Include clear "Done Criteria" for each task. Include "Verify Command" when available.
   - Return valid JSON.

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

Use this template when the DAEMON agent executes a task:

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

Use the Claude backend to extract usage cost from LLM output. This provides real-time cost visibility.

- **Mechanism**: The agent parses the **last JSON block** in the full LLM output with a regex.
- **Expected Key**: Use numeric `cost_usd`.
- **Fallback**: Report `$0.00` if no valid JSON exists. Report `$0.00` if the key is missing. Use the server nightly pricing-table calculation.

## 5. Model Selection & Weighting

Use the generated Plan `recommendedModel` field to select the agent `TaskWeight`:

| **Plan ID** | **TaskWeight** | **Target Backend**          |
| ----------- | -------------- | --------------------------- |
| `flash`     | `flash`        | Gemini 2.0 Flash / Haiku    |
| `pro`       | `pro`          | Gemini 2.0 Pro / Sonnet 3.5 |
