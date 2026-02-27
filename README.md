# Launchblocks

**Spec-Driven Development (SDD) for AI-powered applications.** An interactive CLI that asks a few questions about your app, then generates a complete project specification, SQL migrations, and AI context files — ready to hand to any AI coding tool to build.

Launchblocks is **not** a code generator. It produces the *blueprint* that AI coding tools (Claude Code, Cursor, Codex, Gemini) use to build a full-stack application from scratch.

## Spec-Driven Development

Launchblocks is a **Spec-Driven Development (SDD)** tool. Instead of generating code directly, it generates *specifications* that AI coding tools implement. This approach is now recognized as a best practice for AI-assisted development.

**Why SDD?**

- **AI agents perform better with structured specs** than ad-hoc prompts — numbered tasks, acceptance criteria, and test specifications guide the AI through complex implementations step by step
- **Specs are reviewable, version-controllable, and tool-agnostic** — switch between Claude Code, Cursor, Codex, or Gemini without changing your specs
- **You keep full control over the architecture** — the spec defines *what* to build, the AI handles *how* to build it
- **Repeatable and deterministic** — the same spec produces consistent implementations across runs and teams

## Concept Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LAUNCHBLOCKS ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

  User runs: npx launchblocks init
                    │
                    ▼
  ┌──────────────────────────────┐
  │     CLI Entry Point          │  bin/launchblocks.ts
  │     (Commander.js)           │  Routes to "init" command
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │     Interview Runner         │  src/interview/runner.ts
  │     8 Interactive Prompts    │  Uses @clack/prompts
  │                              │
  │  Q1  AI Tool Selection       │  Claude / Cursor / Codex / Gemini / All
  │  Q2  Roles Definition        │  Preset or custom (2-10 roles)
  │  Q3  Permissions Matrix      │  7 granular permissions per role
  │  Q4  Signup Approval         │  Require admin approval? yes/no
  │  Q5  Admin Panel Access      │  Auto-inferred, user confirms
  │  Q6  LLM Access Roles        │  All roles or specific subset
  │  Q7  LLM Providers           │  OpenAI, Anthropic, Google, etc.
  │  Q8  App Name                │  Converted to slug for identifiers
  └──────────┬───────────────────┘
             │
             │  InterviewAnswers
             ▼
  ┌──────────────────────────────┐
  │     Config Builder           │  src/generator/config-writer.ts
  │                              │
  │  • Normalizes roles          │  camelCase → snake_case
  │  • Generates slug            │  "My App" → "my-app"
  │  • Serializes to YAML        │  launchblocks.config.yaml
  └──────────┬───────────────────┘
             │
             │  LaunchblocksConfig
             ▼
  ┌──────────────────────────────┐
  │     Template Context Builder │  src/generator/template-utils.ts
  │                              │
  │  • Flattens permissions      │  For SQL seed statements
  │  • Maps provider metadata    │  Env vars, docs URLs
  │  • Registers Handlebars      │  eq, neq, includes, join,
  │    helpers                   │  uppercase, ifCond
  └──────────┬───────────────────┘
             │
             │  TemplateContext
             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                     RENDERERS (Parallel)                             │
  │                                                                     │
  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
  │  │  Spec Renderer   │  │  SQL Renderer    │  │  Context Renderer   │ │
  │  │  spec-renderer   │  │  sql-renderer    │  │  context-renderer   │ │
  │  │                  │  │                  │  │                     │ │
  │  │  7 Module Specs  │  │  4 Migrations    │  │  Master Spec        │ │
  │  │  (.hbs → .md)    │  │  (.hbs → .sql)   │  │  Tool Context Files │ │
  │  │                  │  │  + sample-env.md  │  │  Reference Docs     │ │
  │  └────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────┘ │
  └───────────┼─────────────────────┼─────────────────────────┼──────────┘
              │                     │                         │
              ▼                     ▼                         ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                        OUTPUT: launchblocks/                          │
  │                                                                      │
  │  launchblocks.config.yaml        LaunchBlocks_implementation.md      │
  │  CLAUDE.md / .cursorrules /      specs/01..07-*.md                   │
  │  AGENTS.md / GEMINI.md           schemas/migrations/001..004_*.sql   │
  │                                  schemas/sample-env.md               │
  │                                  references/*.md                     │
  └──────────────────────────────────────────────────────────────────────┘
              │
              ▼
  ┌──────────────────────────────┐
  │     MCP Setup Helper         │  src/setup/
  │                              │
  │  • Detects Supabase MCP      │  Checks .mcp.json, ~/.claude.json
  │  • Detects Vercel MCP        │  Checks .cursor/mcp.json
  │  • Optionally installs both  │  Project-level or user-level
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │     Summary & Next Steps     │  src/utils/logger.ts
  │                              │
  │  Lists all created files     │
  │  Shows MCP server status     │
  │  Prints next-step commands   │
  └──────────────────────────────┘
```

## How It Works

Launchblocks operates in three phases: **Interview**, **Generation**, and **Setup**.

### Phase 1: Interview

The CLI collects your app configuration through 8 interactive prompts. Each answer shapes the generated output — roles determine SQL seed data and RLS policies, permissions control admin panel access, provider choices populate environment variable references, and the AI tool selection determines which context file format to generate.

### Phase 2: Generation

Interview answers are transformed into a `LaunchblocksConfig` object, which is serialized to YAML and used to build a Handlebars template context. Three renderers then execute in sequence:

| Renderer | Input Templates | Output Files |
|----------|----------------|--------------|
| **Spec Renderer** | 7 `.hbs` templates in `src/templates/specs/` | `specs/01-project-setup.md` through `specs/07-llm-audit.md` |
| **SQL Renderer** | 4 `.hbs` templates + 1 env template in `src/templates/schemas/` | `schemas/migrations/001_*.sql` through `004_*.sql` + `sample-env.md` |
| **Context Renderer** | Master spec + tool-specific templates + 3 static reference files | `LaunchBlocks_implementation.md`, tool context file(s), `references/*.md` |

All templates use [Handlebars](https://handlebarsjs.com/) with custom helpers (`eq`, `neq`, `includes`, `join`, `uppercase`, `ifCond`) registered at render time.

### Phase 3: MCP Setup

After generation, the CLI detects whether Supabase and Vercel MCP (Model Context Protocol) servers are already configured. If not, it offers to install them at either the project level (`.mcp.json`) or user level (`~/.claude.json`), giving the AI coding tool direct access to your Supabase database and Vercel deployment.

## Quick Start

```bash
npm create launchblocks@latest
```

Or use npx:

```bash
npx launchblocks init
```

Or install globally:

```bash
npm install -g launchblocks
launchblocks init
```

After generation:

```bash
cd launchblocks
# Open in your AI coding tool and tell it:
# "Read LaunchBlocks_implementation.md and implement all 7 modules"
```

## The 8 Interview Questions

| # | Question | Purpose | Impact on Output |
|---|----------|---------|------------------|
| 1 | **AI Tool** | Which AI coding tool will you use? | Determines context file format (CLAUDE.md, .cursorrules, etc.) |
| 2 | **Roles** | Define user roles or use defaults | Seeds role names into SQL migrations and RLS policies |
| 3 | **Permissions** | Assign permissions per role | Generates permission matrix in SQL and spec files |
| 4 | **Signup Approval** | Require admin approval for new users? | Controls signup trigger behavior and approval workflow specs |
| 5 | **Admin Panel** | Which roles see the admin panel? | Configures admin access specs and navigation guards |
| 6 | **LLM Access** | Which roles can use AI features? | Scopes LLM gateway access in specs and SQL |
| 7 | **LLM Providers** | Select LLM providers | Populates provider configs, env vars, and pricing references |
| 8 | **App Name** | Name your application | Used as display name + slug for identifiers |

## Generated Output

```
launchblocks/
├── LaunchBlocks_implementation.md     # Master specification (all 7 modules)
├── launchblocks.config.yaml           # Your configuration in YAML
├── CLAUDE.md                          # AI tool context (varies by selection)
│
├── specs/
│   ├── 01-project-setup.md            # Framework scaffolding, env vars, project structure
│   ├── 02-database.md                 # Schema design, RLS policies, helper functions
│   ├── 03-authentication.md           # Signup, login, OAuth, password reset flows
│   ├── 04-user-management.md          # User CRUD, role management, approval workflow
│   ├── 05-llm-gateway.md             # Python microservice with Celeste AI SDK
│   ├── 06-prompt-management.md        # Prompt template CRUD, versioning, variables
│   └── 07-llm-audit.md               # Audit log schema, cost tracking, export
│
├── schemas/
│   ├── migrations/
│   │   ├── 001_roles_and_permissions.sql   # Roles + permissions tables, RLS, helpers
│   │   ├── 002_users_and_profiles.sql      # User profiles, signup trigger
│   │   ├── 003_prompt_templates.sql        # Prompt templates table + RLS
│   │   └── 004_llm_audit_log.sql           # Audit log table + summary view
│   └── sample-env.md                       # Environment variable reference
│
└── references/
    ├── supabase-auth-patterns.md      # Auth code examples
    ├── vercel-deploy-checklist.md     # Deployment checklist
    └── llm-pricing-table.md           # LLM model pricing data
```

## What Gets Generated — Module by Module

### Module 1: Project Setup
Framework scaffolding for Next.js 14+ (App Router), environment variable configuration, folder structure conventions, and dependency lists.

### Module 2: Database
Complete PostgreSQL schema for Supabase — tables for roles, permissions, user profiles, prompt templates, and audit logs. Includes Row Level Security policies and helper functions (`has_permission()`, `has_role()`).

### Module 3: Authentication
Signup, login, logout, and password reset flows using Supabase Auth. Includes automatic user profile creation via database trigger and optional signup approval gating.

### Module 4: User Management
Admin-facing user list, role assignment, account approval/suspension, and permission enforcement. Specs cover both API routes and UI components.

### Module 5: LLM Gateway
A Python microservice (FastAPI + Celeste AI SDK) that proxies LLM requests through a unified API. Supports routing to any configured provider with role-based access control.

### Module 6: Prompt Management
CRUD interface for prompt templates with version tracking and variable interpolation (`{{variable}}`). Includes admin UI and API route specifications.

### Module 7: LLM Audit
Logging for every AI call — captures model, provider, token counts, latency, cost estimates, and the requesting user. Includes a summary view with aggregations and CSV export.

## Target Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Hosting | Vercel |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| Styling | Tailwind CSS + shadcn/ui |
| LLM Service | Python 3.12+ / FastAPI + Celeste AI SDK |
| LLM Providers | OpenAI, Anthropic, Google, Mistral, Cohere, xAI, DeepSeek, Groq |
| Validation | Zod |

## AI Tool Context Files

Launchblocks generates the right context file for your AI coding tool. Each is a thin wrapper that points to `LaunchBlocks_implementation.md`:

| Tool | Generated File | Purpose |
|------|---------------|---------|
| Claude Code | `CLAUDE.md` | Read automatically by Claude Code sessions |
| Cursor | `.cursorrules` | Loaded as project rules in Cursor |
| Codex / OpenAI | `AGENTS.md` | Agent instructions for Codex |
| Gemini CLI | `GEMINI.md` | Context for Gemini CLI |

## SQL Migrations

The generated migrations are production-ready for Supabase and include:

- Tables with proper constraints, indexes, and foreign keys
- Row Level Security (RLS) policies scoped to user roles
- Database functions: `has_permission(user_id, permission)` and `has_role(user_id, role)`
- Automatic user profile creation on signup via a database trigger
- Seed data for roles and permissions matching your configuration
- Audit log summary view with aggregations by user, provider, and model

## Data Flow

```
Interview Answers
       │
       ▼
┌──────────────┐      ┌──────────────────┐
│ buildConfig  │─────▶│ LaunchblocksConfig│──▶ launchblocks.config.yaml
└──────────────┘      └────────┬─────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │ buildTemplateContext    │
                  │                        │
                  │ • permissions_flat[]    │  Flattened for SQL seeding
                  │ • role_permission_map   │  Role → permissions summary
                  │ • providers_display[]   │  Name, env var, docs URL
                  │ • Config flags          │  has_multiple_providers,
                  │                        │  all_roles_have_llm, etc.
                  └────────────┬───────────┘
                               │
                               │  TemplateContext
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         ┌──────────┐   ┌──────────┐   ┌──────────────┐
         │  7 Spec  │   │  4 SQL   │   │ Master Spec  │
         │ Templates│   │ Templates│   │ + Tool Files │
         │  (.hbs)  │   │  (.hbs)  │   │ + References │
         └────┬─────┘   └────┬─────┘   └──────┬───────┘
              │              │                 │
              ▼              ▼                 ▼
         specs/*.md    migrations/*.sql   *.md files
```

## Internal Architecture

```
bin/
  launchblocks.ts              # CLI entry point — Commander.js routes to init command

src/
  commands/
    init.ts                    # Orchestrates: interview → config → generate → setup → summary

  interview/
    runner.ts                  # Runs all 8 questions in sequence, returns InterviewAnswers
    types.ts                   # TypeScript interfaces: Role, Permission, InterviewAnswers
    questions/
      ai-tool.ts               # Q1: AI tool selection (list prompt)
      roles.ts                 # Q2: Role definition (preset or custom input)
      permissions.ts           # Q3: Permission matrix (checkbox per role)
      signup.ts                # Q4: Signup approval (confirm prompt)
      admin-access.ts          # Q5: Admin panel access (auto-inferred + confirm)
      llm-access.ts            # Q6: LLM access roles (all or checkbox)
      providers.ts             # Q7: Provider selection (multi-checkbox)
      app-info.ts              # Q8: App name (text input)

  generator/
    index.ts                   # Coordinates config writing and all three renderers
    config-writer.ts           # InterviewAnswers → LaunchblocksConfig → YAML file
    template-utils.ts          # Handlebars helper registration + context builder
    spec-renderer.ts           # Renders 7 module spec markdown files
    sql-renderer.ts            # Renders 4 SQL migrations + sample-env
    context-renderer.ts        # Renders master spec, tool context files, copies references

  setup/
    detect.ts                  # Scans for existing MCP server configs
    guide.ts                   # Interactive MCP setup prompts
    install.ts                 # Writes MCP configs to .mcp.json or ~/.claude.json
    types.ts                   # McpServerStatus, SetupResult interfaces

  templates/                   # Handlebars templates (shipped with package)
    ai-context.md.hbs          # Master spec template
    claude-md.md.hbs           # CLAUDE.md template
    cursorrules.md.hbs         # .cursorrules template
    agents-md.md.hbs           # AGENTS.md template
    gemini-md.md.hbs           # GEMINI.md template
    specs/                     # 7 module spec templates
    schemas/                   # 4 SQL + sample-env templates
    references/                # 3 static reference docs (copied as-is)

  utils/
    logger.ts                  # Styled console output with Chalk (banner, step, summary)
    validation.ts              # Input validators (roles, app name, comma parsing)
    slug.ts                    # toSlug(), toDisplayName() string utilities
    exec.ts                    # execAsync(), commandExists() shell helpers
```

## Dependencies

| Package | Purpose |
|---------|---------|
| [commander](https://github.com/tj/commander.js) | CLI argument parsing and command routing |
| [@clack/prompts](https://github.com/natemoo-re/clack) | Interactive terminal prompts for the interview |
| [ora](https://github.com/sindresorhus/ora) | Elegant terminal spinners for progress feedback |
| [handlebars](https://handlebarsjs.com/) | Template engine for specs, SQL, and context files |
| [chalk](https://github.com/chalk/chalk) | Colored terminal output |
| [fs-extra](https://github.com/jprichardson/node-fs-extra) | File system operations (write, copy, ensureDir) |
| [yaml](https://github.com/eemeli/yaml) | YAML serialization for config file |

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
| `npm run build` | Compile TypeScript + copy templates to `dist/` |
| `npm run dev` | Watch mode — rebuild on file changes |
| `npm start` | Run the built CLI (`node dist/bin/launchblocks.js`) |

### Build Process

The build step compiles TypeScript with [tsup](https://tsup.egoist.dev/) (targeting Node 18, ESM-only output) and copies `src/templates/` to `dist/templates/` so Handlebars templates ship with the package. The CLI entry point gets a `#!/usr/bin/env node` shebang injected automatically.

### Running Tests

```bash
npx tsx test/test-generator.ts
```

Runs the generator with both default and custom configurations, verifying all templates render correctly and all expected files are created.

## License

MIT License. See [LICENSE](LICENSE) for details.
