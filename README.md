# Launchblocks

Spec-driven launchpad for AI-powered applications. An interactive CLI that asks you 8 questions about your app, then generates a complete project specification, SQL migrations, and AI context files — ready to hand to any AI coding tool to build.

## What It Does

Instead of writing boilerplate or starting from scratch, Launchblocks generates everything an AI coding tool needs to build a full-stack application with:

- **User Authentication** (signup, login, password reset via Supabase Auth)
- **Role-Based Access Control** (custom roles, granular permissions, admin panel)
- **LLM Gateway** (Python microservice with Celeste AI SDK — supports OpenAI, Anthropic, Google, Mistral, Cohere, xAI, DeepSeek, Groq)
- **Prompt Management** (CRUD for prompt templates with versioning and variable interpolation)
- **LLM Audit Trail** (logging every AI call with token counts, cost estimates, and latency)
- **Signup Approval Workflow** (optional admin approval for new users)

The generated output includes SQL migrations ready to run in Supabase, detailed module specs, and a master `LaunchBlocks_implementation.md` file that any AI coding tool can use to implement the entire project.

## Quick Start

```bash
npx launchblocks init
```

Or install globally:

```bash
npm install -g launchblocks
launchblocks init
```

## How It Works

Running `launchblocks init` walks you through 8 steps:

| Step | Question | What It Configures |
|------|----------|--------------------|
| 1 | **Roles** | Define user roles (e.g. super_admin, admin, user) or use defaults |
| 2 | **Permissions** | Assign granular permissions to each role |
| 3 | **Signup Behavior** | Whether new users require admin approval |
| 4 | **Admin Panel Access** | Which roles can access the admin panel |
| 5 | **LLM Access** | Which roles can use AI/LLM features |
| 6 | **LLM Providers** | Choose from OpenAI, Anthropic, Google, Mistral, Cohere, xAI, DeepSeek, Groq |
| 7 | **App Info** | Your application name |
| 8 | **AI Tool** | Which AI coding tool you'll use (Claude Code, Cursor, Codex, Gemini) |

After answering, Launchblocks generates a `launchblocks/` directory with everything you need:

```
launchblocks/
  LaunchBlocks_implementation.md              # Master specification for your app
  launchblocks.config.yaml                   # Project configuration
  CLAUDE.md / .cursorrules / AGENTS.md / GEMINI.md  # AI tool context file
  specs/
    01-project-setup.md                      # Module 1 spec
    02-database.md                           # Module 2 spec
    03-authentication.md                     # Module 3 spec
    04-user-management.md                    # Module 4 spec
    05-llm-gateway.md                        # Module 5 spec
    06-prompt-management.md                  # Module 6 spec
    07-llm-audit.md                          # Module 7 spec
  schemas/
    migrations/
      001_roles_and_permissions.sql          # Roles + permissions tables
      002_users_and_profiles.sql             # User profiles + signup trigger
      003_prompt_templates.sql               # Prompt templates table
      004_llm_audit_log.sql                  # Audit log + summary view
    sample-env.md                            # Environment variable reference
  references/
    supabase-auth-patterns.md                # Auth code examples
    vercel-deploy-checklist.md               # Deployment checklist
    llm-pricing-table.md                     # LLM model pricing data
```

## Next Steps After Generation

1. `cd launchblocks`
2. Open the project in your AI coding tool
3. Tell it: *"Read LaunchBlocks_implementation.md and implement all 7 modules"*

The AI tool will use the generated specs and SQL migrations to build a complete full-stack app on Next.js + Supabase + Vercel.

## Generated Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Hosting | Vercel |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| Styling | Tailwind CSS + shadcn/ui |
| LLM Service | Python 3.12+ / FastAPI + Celeste AI SDK |
| LLM Providers | OpenAI, Anthropic, Google, Mistral, Cohere, xAI, DeepSeek, Groq (configurable) |
| Validation | Zod |

## Features

### Customizable Roles & Permissions

Define your own roles or use the defaults (`super_admin`, `admin`, `user`). Each role gets granular permissions:

- `manage_users` — View user list, approve/suspend accounts
- `manage_roles` — Change user roles
- `manage_prompts` — Create/edit/delete prompt templates
- `view_audit_log` — View LLM audit trail and cost data
- `export_audit_log` — Export audit data as CSV
- `manage_settings` — Modify application settings
- `manage_providers` — Add/edit LLM provider configs

### AI Tool Context Files

Launchblocks generates the right context file for your AI coding tool:

| Tool | Generated File |
|------|---------------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| Codex / OpenAI | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |

Choose one or generate all four.

### Production-Ready SQL

The generated SQL migrations include:

- Tables with proper constraints and indexes
- Row Level Security (RLS) policies
- Database functions (`has_permission()`, `has_role()`)
- Automatic user profile creation on signup via trigger
- Audit log summary view with aggregations
- Seed data for roles and permissions

## Development

### Prerequisites

- Node.js >= 18

### Setup

```bash
git clone https://github.com/vrrosales/launchblocks.git
cd launchblocks
npm install
npm run build
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript and copy templates to `dist/` |
| `npm run dev` | Watch mode — rebuild on file changes |
| `npm start` | Run the built CLI |

### Running Tests

```bash
npx tsx test/test-generator.ts
```

This runs the generator with both default and custom configurations, verifying all templates render correctly and all expected files are created.

### Project Structure

```
bin/
  launchblocks.ts          # CLI entry point (Commander.js)
src/
  commands/
    init.ts                # The `init` command
  interview/
    runner.ts              # Orchestrates the 8-step interview
    types.ts               # TypeScript types for roles, permissions, answers
    questions/             # Individual interview steps
  generator/
    index.ts               # Main generator orchestrator
    config-writer.ts       # Writes launchblocks.config.yaml
    spec-renderer.ts       # Renders module spec markdown files
    sql-renderer.ts        # Renders SQL migration files
    context-renderer.ts    # Renders LaunchBlocks_implementation.md + tool context files + references
    template-utils.ts      # Handlebars helpers and template context builder
  templates/               # Handlebars templates for all generated files
    specs/                 # Module spec templates
    schemas/               # SQL migration templates
    references/            # Static reference docs (copied as-is)
  utils/
    logger.ts              # Styled console output
    validation.ts          # Input validation functions
    slug.ts                # String utilities
test/
  test-generator.ts        # Programmatic generator test
```

## License

MIT License. See [LICENSE](LICENSE) for details.
