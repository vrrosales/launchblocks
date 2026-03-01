# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**LLM Providers:**
- OpenAI - Chat completion models (GPT-4, etc.)
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `OPENAI_API_KEY` env var
  - Docs: https://platform.openai.com/api-keys

- Anthropic (Claude) - LLM API
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `ANTHROPIC_API_KEY` env var
  - Docs: https://console.anthropic.com/settings/keys

- Google (Gemini) - LLM models
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `GOOGLE_AI_API_KEY` env var
  - Docs: https://aistudio.google.com/app/apikey

- Mistral - LLM API
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `MISTRAL_API_KEY` env var
  - Docs: https://console.mistral.ai/api-keys

- Cohere - LLM API (Command R+)
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `CO_API_KEY` env var
  - Docs: https://dashboard.cohere.com/api-keys

- xAI (Grok) - LLM API
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `XAI_API_KEY` env var
  - Docs: https://console.x.ai

- DeepSeek - LLM API
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `DEEPSEEK_API_KEY` env var
  - Docs: https://platform.deepseek.com/api_keys

- Groq - LPU Inference API
  - SDK/Client: Native HTTP API calls expected in generated projects
  - Auth: `GROQ_API_KEY` env var
  - Docs: https://console.groq.com/keys

**Payment Processing:**
- Stripe - Billing and subscription management (optional module)
  - Implementation: Generated when `--include-billing` flag is used
  - Models supported: subscription, usage-based, or both
  - Files: Billing spec template at `src/templates/specs/08-billing.md.hbs`
  - Configuration: `include_billing` and `billing_model` in `LaunchblocksConfig`

## Data Storage

**Databases:**
- Supabase (PostgreSQL) - Primary database integration
  - Connection: Project-specific API keys
  - Client: Recommended via supabase-js SDK
  - Auth templates: `src/templates/references/supabase-auth-patterns.md`
  - Schema support: SQL templates generated for roles, users, profiles, prompts, audit logs, billing

- PostgreSQL (via Supabase) - Default database
  - Connection: Supabase connection string
  - Client: Migrations and queries configured in generated schemas
  - Schema files: `src/templates/schemas/*.sql.hbs`
    - `001_roles_and_permissions.sql.hbs`
    - `002_users_and_profiles.sql.hbs`
    - `003_prompt_templates.sql.hbs`
    - `004_llm_audit_log.sql.hbs`
    - `005_billing.sql.hbs`

**File Storage:**
- Not explicitly integrated in CLI
- Supabase Storage is recommended for file uploads (documented in generated auth patterns)

**Caching:**
- Not explicitly integrated in CLI
- Supabase realtime and Redis patterns may be documented in generated references

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Authentication system (primary integration)
  - Implementation: PostgreSQL-based role and permission system
  - Schema: Users table, roles table, permissions table with RLS policies
  - MCP Server: Supabase MCP available at https://mcp.supabase.com/mcp
  - Features: Row-level security (RLS), role-based access control (RBAC)

**Role System:**
- Custom RBAC implementation
  - Owner role: First role specified in interview
  - Default role: Last role specified in interview
  - Admin roles: Configurable subset for administrative access
  - User role: All users can be assigned any role
  - Permissions: Explicit permission list per role (edit, delete, create, read, etc.)

**Approval Workflow:**
- Optional signup approval feature (`require_approval` config)
  - When enabled: New signups in pending_approval status until admin approval
  - When disabled: New signups automatically approved
  - Implementation: Status field in users table schema

## Monitoring & Observability

**Error Tracking:**
- Not detected - Generated projects expected to implement via Sentry, LogRocket, or similar

**Logs:**
- LLM Audit Log - Generated schema tracks all LLM API calls
  - Schema: `src/templates/schemas/004_llm_audit_log.sql.hbs`
  - Fields: Provider, model, tokens, cost, timestamp, user_id
  - Purpose: Token usage tracking and cost monitoring
  - Reference: `src/templates/references/llm-pricing-table.md`

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary deployment target (optional MCP integration)
  - MCP Server: Vercel MCP available at https://mcp.vercel.com
  - Deployment: Next.js/Node.js applications expected
  - Reference docs: `src/templates/references/vercel-deploy-checklist.md`

**CI Pipeline:**
- Not explicitly configured in CLI
- Generated projects expected to use GitHub Actions or Vercel's built-in CI

## Environment Configuration

**Required env vars:**
- At least one LLM provider API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
- Supabase connection details (SUPABASE_URL, SUPABASE_ANON_KEY)
- Optional Stripe API key (if billing enabled): STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
- Optional Vercel deployment tokens (for Vercel CLI integration)

**Secrets location:**
- Project `.env.local` (Git-ignored via .gitignore)
- Supabase project secrets in dashboard
- MCP configuration: `.mcp.json` (project) or `~/.claude.json` (user) or `.cursor/mcp.json` (Cursor)

**Generated Env Template:**
- `src/templates/schemas/sample-env.md.hbs` - Sample environment variables documentation

## AI Tool Integrations

**Supported AI Tools:**
- Claude Code - Context file: `CLAUDE.md`
  - MCP support: Yes (full MCP integration via .mcp.json or ~/.claude.json)
  - Server detection: Checks `~/.claude.json` for Supabase and Vercel MCP servers

- Cursor - Context file: `.cursorrules`
  - MCP support: Yes (Cursor-specific MCP in `.cursor/mcp.json`)
  - Server detection: Checks `.cursor/mcp.json`

- OpenAI Codex - Context file: `AGENTS.md`
  - MCP support: Limited
  - Server detection: No MCP

- Google Gemini - Context file: `GEMINI.md`
  - MCP support: Limited
  - Server detection: No MCP

## MCP (Model Context Protocol) Servers

**Supabase MCP:**
- URL: https://mcp.supabase.com/mcp
- Purpose: Database schema introspection and query assistance
- Detection: `src/setup/detect.ts` checks `~/.claude.json` and project `.mcp.json`
- Installation: `src/setup/install.ts` configures in appropriate config file

**Vercel MCP:**
- URL: https://mcp.vercel.com
- Purpose: Deployment and environment management
- Detection: `src/setup/detect.ts` checks `~/.claude.json` and project `.mcp.json`
- Installation: `src/setup/install.ts` configures in appropriate config file

**MCP Configuration Flow:**
1. Interview asks which AI tool will be used
2. Setup phase detects existing MCP servers
3. Guide prompts user to install Supabase and Vercel MCPs
4. Installation updates appropriate config file:
   - Cursor: `.cursor/mcp.json`
   - Claude Code: `project/.mcp.json` or `~/.claude.json`

## Webhooks & Callbacks

**Incoming:**
- Not explicitly configured in CLI
- Stripe webhooks expected for billing events (if billing module enabled)

**Outgoing:**
- Supabase realtime subscriptions expected in generated projects
- Stripe webhook endpoint expected if billing enabled

## Generated Templates & References

**Specifications Generated:**
- `01-project-setup.md` - Project structure and setup guide
- `02-database.md` - Database schema and relationships
- `03-authentication.md` - Auth implementation with Supabase
- `04-user-management.md` - Role, permission, and user management
- `05-llm-gateway.md` - LLM API abstraction layer
- `06-prompt-management.md` - Prompt template storage and management
- `07-llm-audit.md` - Token usage and cost tracking
- `08-billing.md` - Billing system (optional)

**Reference Documentation:**
- `supabase-auth-patterns.md` - Code examples for auth
- `vercel-deploy-checklist.md` - Deployment steps
- `llm-pricing-table.md` - Provider pricing and token costs

---

*Integration audit: 2026-03-01*
