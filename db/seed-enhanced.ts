// Enhanced seed data with comprehensive specs, plans, and task states
// This demonstrates what rich seed data looks like for testing

export const ENHANCED_SPEC_VERSIONS = {
  // Project 1: Blaze UI Redesign - Component Library Refactor v2
  componentLibraryV2: `# Component Library Refactor (v2)

## Overview
Complete overhaul of our component library to modernize the codebase, improve accessibility compliance, and align with our new design system tokens. This is a critical initiative that will unlock faster feature development across all product teams.

## Design System Foundation
Extract and formalize our design tokens from the current scattered implementations into a centralized system. Define tokens for colors (primary, secondary, status), typography (font families, sizes, weights, line heights), spacing (base unit system), shadows, and border radiuses. Implement as CSS variables for runtime theming support.

## Component Coverage
Refactor core interactive components: Button (with 4 variants: primary, secondary, ghost, danger), Form inputs (text, email, password, select, checkbox, radio), Card container, Modal dialog, Tabs navigation, and Dropdown menu. Each component requires accessibility attributes (ARIA labels, roles), keyboard navigation support, and comprehensive visual variants.

## Quality Assurance
Write Storybook stories for all components with interaction tests using Playwright. Create a comprehensive migration guide documenting breaking API changes for consumer teams. Establish QA acceptance criteria: WCAG 2.1 AA compliance, cross-browser testing (Chrome, Firefox, Safari, Edge), mobile responsiveness verification, and performance benchmarks.

## Deliverables
- Design token system (CSS variables file)
- Refactored component library (TypeScript + React)
- Storybook stories with interaction tests
- Migration guide for consuming teams
- Accessibility audit report`,

  // Project 2: Auth Service - OAuth2 Integration
  oauth2Integration: `# OAuth2 Integration (In Progress)

## Architecture Overview
Implement OAuth 2.0 with Authorization Code Flow for secure third-party authentication. Support Google, GitHub, and Microsoft as initial providers. Implement proper token management with secure storage in HTTP-only cookies and Redis caching layer for session state. Establish clear security boundaries and error handling protocols.

## Provider Configuration
Configure each OAuth provider: client_id, client_secret, redirect_uri management. Implement dynamic provider discovery for future extensibility. Set up secure credential rotation strategies. Define scopes for user data access: email, profile, openid. Handle provider-specific quirks and response formats.

## Token Management
Implement access token caching with TTL-based expiration. Design refresh token rotation strategy with security considerations. Store tokens in Redis with encrypted values. Implement automatic token refresh before expiration with retry logic for edge cases. Handle token revocation on logout.

## Integration Points
Build OAuth callback handler route for post-authentication token exchange. Implement user creation/lookup logic based on provider claims. Establish user profile synchronization strategy. Set up session initialization after successful authentication. Define rollback procedures for failed authentications.

## Security & Testing
Implement PKCE (Proof Key for Code Exchange) for mobile clients. Add CSRF protection on callback routes. Write comprehensive integration tests for each provider. Perform security audit of token storage mechanisms. Load test authentication flows under peak conditions.`,

  // Project 3: Payments v2 - Stripe Checkout
  stripeCheckout: `# Stripe Checkout Flow Implementation

## Payment Processing Pipeline
Integrate Stripe Elements for PCI-compliant card collection without handling raw card data. Build checkout form with card input, billing address, and email. Implement real-time validation and error messaging for better user experience. Support multiple payment methods: cards, digital wallets (Apple Pay, Google Pay), and regional methods.

## Order Creation & Confirmation
Establish order lifecycle: cart → checkout → payment processing → confirmation. Generate idempotency keys for payment requests to prevent duplicate charges. Implement payment intent creation and confirmation flows. Store order state in database with transaction tracking. Send confirmation emails with order details and receipt.

## Webhook Handling
Implement webhook endpoint for asynchronous payment events (charge.succeeded, charge.failed, refund.created). Validate webhook signatures using Stripe's signing secrets. Design robust message queue for webhook processing with retry logic. Handle edge cases: out-of-order events, duplicate events, late-arriving notifications.

## Error Handling & Recovery
Implement comprehensive error classification: user errors (invalid card), system errors (API failures), network errors (timeouts). Design retry strategies with exponential backoff. Create user-friendly error messages for common failures. Implement manual payment reconciliation tools for support team.

## Testing & Compliance
Set up Stripe test environment with test card numbers and scenarios. Write integration tests for happy paths and error cases. Verify PCI compliance through Stripe's compliance tools. Document all security considerations and sensitive data handling. Perform load testing on payment endpoints.`,
};

export const ENHANCED_PLANS = {
  // Project 2: OAuth2 Plan
  oauth2Plan: `# Plan: OAuth2 Integration for Auth Service

## Breakdown of Work

### Phase 1: Provider Setup (Estimated: 8 hours)
- Configure Google OAuth application in Google Cloud Console
- Set up GitHub OAuth application in developer settings
- Configure Microsoft Azure AD application registration
- Create secure credential storage for client secrets
- Implement environment variable management for multi-environment support
- Write provider configuration abstraction layer

### Phase 2: Core OAuth Flow (Estimated: 16 hours)
- Implement Authorization Code Flow with PKCE support
- Build OAuth callback handler route with secure state validation
- Implement token exchange logic from authorization code
- Create access/refresh token storage strategy in Redis
- Build user session initialization after token acquisition
- Implement logout and token revocation flows

### Phase 3: User Integration (Estimated: 12 hours)
- Implement user creation from provider claims (sub, email, name)
- Build user lookup by provider ID and email
- Create user profile synchronization from provider data
- Implement link/unlink accounts functionality
- Handle edge case: existing user email from different provider
- Build test user data fixtures for each provider

### Phase 4: Security Hardening (Estimated: 10 hours)
- Implement CSRF token validation on callback routes
- Set up HTTP-only cookie configuration for token storage
- Implement rate limiting on auth endpoints
- Add security headers (CSP, X-Frame-Options, etc.)
- Perform OWASP Top 10 security review
- Document security architecture and threat model

### Phase 5: Testing & Documentation (Estimated: 10 hours)
- Write integration tests for each OAuth provider
- Create end-to-end test flows for success and failure paths
- Document provider-specific setup instructions
- Create troubleshooting guide for common OAuth issues
- Write API documentation for auth endpoints
- Perform load testing on authentication endpoints

## Risk Mitigation
- Provider API changes: Implement adapter pattern for provider-specific logic
- Token expiration: Implement automatic refresh with user notification
- Third-party outages: Design fallback authentication mechanisms
- Security vulnerabilities: Subscribe to OAuth/OIDC security bulletins`,

  // Project 3: Payments Plan
  paymentsCheckoutPlan: `# Plan: Stripe Checkout Flow Implementation

## Implementation Strategy

### Phase 1: Stripe Integration Scaffold (Estimated: 12 hours)
- Set up Stripe account and API key management
- Initialize Stripe SDK in backend and frontend
- Implement webhook endpoint with signature verification
- Configure test environment with test API keys
- Set up Stripe event type subscriptions (charge.*, refund.*, etc.)
- Create logging infrastructure for payment events

### Phase 2: Checkout UI & Validation (Estimated: 14 hours)
- Build checkout form component with Stripe Elements
- Implement card input with real-time validation
- Add billing address form with address validation
- Implement email confirmation and order review
- Create error display with user-friendly messages
- Style checkout UI matching brand guidelines

### Phase 3: Payment Processing (Estimated: 16 hours)
- Implement payment intent creation workflow
- Build idempotency key generation for request deduplication
- Implement payment confirmation with error handling
- Create order record with transaction references
- Set up payment method tokenization for recurring charges
- Build refund request processing workflow

### Phase 4: Webhook & Async Events (Estimated: 12 hours)
- Implement robust webhook signature validation
- Build message queue for reliable event processing
- Implement event ordering and deduplication logic
- Create retry mechanism for failed webhook processing
- Set up monitoring/alerting for webhook failures
- Document all webhook event types and handling

### Phase 5: Post-Purchase Experience (Estimated: 10 hours)
- Implement order confirmation email templating
- Build receipt generation with line items and totals
- Create user dashboard for order history
- Implement order status tracking and updates
- Set up payment issue notifications
- Build admin tools for manual order adjustments

## Dependencies
- Requires completed auth system (user ID available)
- Requires inventory/cart system for order items
- Requires email service for confirmations

## Success Criteria
- All Stripe test scenarios passing
- Zero false negatives on payment processing
- Webhook delivery rate >99.9%
- PCI compliance validation complete
- Load test: 500 concurrent checkouts`,
};

export const ENHANCED_TASK_STATES = [
  // Running session example - OAuth2 Integration tasks
  {
    id: 301,
    planId: 3,
    specId: 3,
    externalId: 'T-301',
    title: 'Configure Google OAuth Application',
    status: 'in_progress' as const,
    executionOrder: 1,
    startedAt: new Date(new Date('2026-03-15T12:00:00Z').getTime() - 2 * 3600 * 1000),
    description: 'Create OAuth app in Google Cloud Console and obtain credentials',
  },
  {
    id: 302,
    planId: 3,
    specId: 3,
    externalId: 'T-302',
    title: 'Configure GitHub OAuth Application',
    status: 'todo' as const,
    executionOrder: 2,
    dependsOn: ['T-301'],
    description: 'Register application in GitHub Developer Settings',
  },
  {
    id: 303,
    planId: 3,
    specId: 3,
    externalId: 'T-303',
    title: 'Implement Authorization Code Flow',
    status: 'blocked' as const,
    executionOrder: 3,
    dependsOn: ['T-301', 'T-302'],
    blockedReason: 'Waiting for provider credentials configuration to complete',
    description: 'Build OAuth 2.0 Authorization Code Flow with PKCE support',
  },
  {
    id: 304,
    planId: 3,
    specId: 3,
    externalId: 'T-304',
    title: 'Write OAuth Integration Tests',
    status: 'todo' as const,
    executionOrder: 4,
    dependsOn: ['T-303'],
    description: 'Create comprehensive test suite for all OAuth flows',
  },
];

export const ENHANCED_FILE_CHANGES = [
  {
    id: 1,
    taskId: 301,
    filePath: 'src/lib/oauth/google.ts',
    changeType: 'created' as const,
    additions: 145,
    deletions: 0,
    status: 'pending' as const,
  },
  {
    id: 2,
    taskId: 301,
    filePath: 'src/config/oauth-providers.ts',
    changeType: 'modified' as const,
    additions: 32,
    deletions: 8,
    status: 'pending' as const,
  },
  {
    id: 3,
    taskId: 105,
    filePath: 'src/components/Button.tsx',
    changeType: 'modified' as const,
    additions: 89,
    deletions: 56,
    status: 'committed' as const,
  },
];

export const RUNNING_SESSION_EXAMPLE = {
  id: 5,
  projectId: 2,
  specId: 3,
  planId: 3,
  status: 'running' as const,
  currentTaskId: 301,
  tasksExecuted: 1,
  tasksSucceeded: 1,
  tasksFailed: 0,
  startedBy: 'user_sam',
  startedAt: new Date('2026-03-15T10:00:00Z'),
  lastHeartbeatAt: new Date('2026-03-15T12:35:00Z'),
  gitBaseBranch: 'main',
  agentVersion: 'specdrivr-agent/1.3.0',
};

export const AGENT_EVENTS_FOR_RUNNING_SESSION = [
  {
    sessionId: 5,
    specId: 3,
    eventType: 'SESSION_STARTED',
    message: 'Agent session started for OAuth2 Integration',
    createdAt: new Date('2026-03-15T10:00:00Z'),
  },
  {
    sessionId: 5,
    specId: 3,
    taskId: 301,
    eventType: 'TASK_STARTED',
    message: 'Starting T-301: Configure Google OAuth Application',
    createdAt: new Date('2026-03-15T10:05:00Z'),
  },
  {
    sessionId: 5,
    specId: 3,
    taskId: 301,
    eventType: 'TASK_PROGRESS',
    message: 'Created Google Cloud project and OAuth consent screen configured',
    createdAt: new Date('2026-03-15T10:25:00Z'),
  },
  {
    sessionId: 5,
    specId: 3,
    taskId: 301,
    eventType: 'TASK_DONE',
    message: 'T-301 completed: Google OAuth credentials obtained and stored',
    createdAt: new Date('2026-03-15T10:35:00Z'),
  },
];
