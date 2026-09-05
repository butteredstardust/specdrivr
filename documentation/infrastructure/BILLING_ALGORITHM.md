SPECDRIVR

Master Product Specification — Billing & Usage Algorithm

---

## 1. Overview

Specdrivr tracks AI costs for each specification and project. Use this document to calculate token usage in USD for `/settings/usage`.

## 2. Pricing Configuration

Use the versioned pricing table when model costs change.

### 2.1 Pricing Table

| Model                 | Input (per 1k tokens) | Output (per 1k tokens) |
| --------------------- | --------------------- | ---------------------- |
| **gemini-2.0-flash**  | $0.00010              | $0.00040               |
| **gemini-2.0-pro**    | $0.00125              | $0.00500               |
| **claude-3-5-sonnet** | $0.00300              | $0.01500               |
| **claude-3-haiku**    | $0.00025              | $0.00125               |

## 3. Calculation Formula

Calculate costs when a task completes or a plan is generated.

### 3.1 Base Formula

$$Cost_{Total} = \left( \frac{Tokens_{Input}}{1000} \times Price_{Input} \right) + \left( \frac{Tokens_{Output}}{1000} \times Price_{Output} \right)$$

### 3.2 Implementation Rule

- **Precision**: Store costs as `NUMERIC(10,4)` in the database. This supports sub-cent values.
- **Aggregation**: Aggregate daily usage by project. Store it in the `usage_stats` table for dashboard performance.

## 4. Reporting

- **Real-time**: Show each task cost in the Task Drawer ATTEMPTS tab.
- **Project-level**: Show monthly and daily breakdowns in `/settings/usage`.
