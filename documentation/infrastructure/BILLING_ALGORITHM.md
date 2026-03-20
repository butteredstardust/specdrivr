**SPECDRIVR**

Master Product Specification — Billing & Usage Algorithm

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr tracks the operational cost of AI interactions per specification and project. This document defines how token usage is translated into USD values displayed in the `/settings/usage` dashboard.

## 2. Pricing Configuration

The system uses a versioned pricing table to handle changes in model costs over time.

### 2.1 Pricing Table
| Model | Input (per 1k tokens) | Output (per 1k tokens) |
|---|---|---|
| **gemini-2.0-flash** | $0.00010 | $0.00040 |
| **gemini-2.0-pro** | $0.00125 | $0.00500 |
| **claude-3-5-sonnet** | $0.00300 | $0.01500 |
| **claude-3-haiku** | $0.00025 | $0.00125 |

## 3. Calculation Formula

Costs are calculated at the time of task completion or plan generation.

### 3.1 Base Formula
$$Cost_{Total} = \left( \frac{Tokens_{Input}}{1000} \times Price_{Input} \right) + \left( \frac{Tokens_{Output}}{1000} \times Price_{Output} \right)$$

### 3.2 Implementation Rule
- **Precision**: Store costs as `NUMERIC(10,4)` in the database to handle sub-cent values.
- **Aggregation**: Daily usage is aggregated per project and stored in the `usage_stats` table to optimize dashboard performance.

## 4. Reporting

- **Real-time**: Individual task costs are visible in the Task Drawer's ATTEMPTS tab.
- **Project-level**: Monthly and daily breakdowns are available in `/settings/usage`.
