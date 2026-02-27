# Implementation Roadmap — UX Gap Closure

This document defines 8 implementation phases to address all gaps identified in `gaps.md`. Phases are designed to be executed independently, but are ordered so that earlier phases provide foundations that later phases build on.

## Dependency Graph

```
Phase 1: CLI Flags & Automation ─────────┐
   (Gaps 9, 1, 3)                        │
                                         │
Phase 2: Config Reuse ───────────────────┼──▶ Phase 6: Incremental Commands
   (Gap 4)                               │       (Gap 6)
                                         │
Phase 3: Output UX Polish ──────────────(independent)
   (Gap 5 + spinners + next steps)       │
                                         │
Phase 4: Spec Quality Enhancement ──────(independent)
   (Gaps 2, 8)                           │
                                         │
Phase 5: Prompt Library Migration ──────(independent)
   (@clack/prompts)                      │
                                         │
Phase 6: Incremental Commands ◀──────────┘  (depends on Phase 2)
   (Gap 6)

Phase 7: Billing Module ────────────────(independent)
   (Gap 7)

Phase 8: Branding & Distribution ───────(independent)
   (Gap 10 + create-launchblocks alias)
```

**Phases 1–5, 7, and 8 have no hard dependencies on each other and can be executed in any order.**
**Phase 6 requires Phase 2 to be completed first** (the `add` command needs the config reader from Phase 2).

---

## Phase 1: CLI Flags & Automation

**Gaps addressed:** #9 (CLI flags), #1 (`--defaults`), #3 (`--dry-run`)
**Estimated scope:** `bin/launchblocks.ts`, `src/commands/init.ts`, `src/interview/runner.ts`

### Problem

The CLI is fully interactive with no flags. It cannot be used in CI/CD pipelines, scripts, or automation workflows. Users who want the recommended setup still have to answer 8 questions.

### Current State

- `bin/launchblocks.ts` defines a single `init` command with zero options via Commander.js
- `src/commands/init.ts` calls `runInterview()` unconditionally — no way to bypass
- All 8 interview questions are always presented interactively
- No non-interactive mode exists

### Implementation Plan

#### 1.1 Add Commander.js options to `init` command

Add flags to `bin/launchblocks.ts` that map to every interview answer:

```
launchblocks init [options]

Options:
  --defaults                  Use recommended defaults, skip interview
  --dry-run                   Preview output without writing files
  --app-name <name>           Application name
  --roles <roles>             Comma-separated role names (first = owner, last = default)
  --require-approval          Require admin approval for signups
  --no-require-approval       Don't require approval
  --llm-providers <list>      Comma-separated providers (openai,anthropic,google,...)
  --llm-access <roles>        Comma-separated roles with LLM access, or "all"
  --ai-tool <tool>            AI tool: claude | cursor | codex | gemini | all
  --skip-mcp                  Skip MCP server setup
```

Commander.js passes these as an options object to the action handler.

#### 1.2 Modify `initCommand` to accept options

Update `src/commands/init.ts` to:

1. Receive the Commander options object
2. If `--defaults` is set: build `InterviewAnswers` from hardcoded defaults (the same defaults already used by the interview questions — `super_admin/admin/user` roles, OpenAI provider, `require_approval: true`, etc.)
3. If individual flags are set: pre-populate answers and skip those interview questions
4. If `--dry-run` is set: pass a `dryRun: true` flag to `generateProject()`
5. If no flags: run the full interactive interview as today

#### 1.3 Update `runInterview` to accept partial answers

Modify `src/interview/runner.ts` to accept an optional `Partial<InterviewAnswers>` parameter. For any field already provided, skip that question. This enables mixed mode: some flags + some interactive prompts.

#### 1.4 Implement dry-run mode in generator

Modify `src/generator/index.ts`:

1. Accept a `dryRun: boolean` option
2. When true: render all templates in memory but don't write to disk
3. Instead, display a preview:
   - File tree with paths and sizes
   - Optionally show file contents for specific files (e.g., `--dry-run --show-config`)
4. Ask "Proceed with generation? (Y/n)" or exit if `--yes` is also passed

#### 1.5 Add `--skip-mcp` flag

Simple boolean flag in `initCommand` that skips the `runSetup()` call entirely.

### Files Changed

| File | Change |
|------|--------|
| `bin/launchblocks.ts` | Add `.option()` calls for all flags |
| `src/commands/init.ts` | Accept options, implement defaults/dry-run logic |
| `src/interview/runner.ts` | Accept partial answers, skip answered questions |
| `src/interview/types.ts` | Add `CLIOptions` interface |
| `src/generator/index.ts` | Add dry-run mode (render without writing) |

### Acceptance Criteria

- [ ] `launchblocks init --defaults` generates a project with zero prompts
- [ ] `launchblocks init --dry-run` shows file preview without writing anything
- [ ] `launchblocks init --app-name "Foo" --roles "admin,user"` skips those two questions, prompts for the rest
- [ ] `launchblocks init --defaults --dry-run` shows preview of default project, no prompts, no writes
- [ ] `launchblocks init --skip-mcp` skips MCP setup entirely
- [ ] All existing interactive behavior unchanged when no flags are passed
- [ ] `launchblocks init --help` documents all flags

---

## Phase 2: Config Reuse

**Gaps addressed:** #4 (config file reuse)
**Estimated scope:** New file `src/generator/config-reader.ts`, changes to `init.ts`

### Problem

The CLI generates `launchblocks.config.yaml` but can never read it back. Users cannot regenerate their project after changing the config file, and there's no way to update a project without re-answering all 8 questions.

### Current State

- `src/generator/config-writer.ts` has `buildConfig(answers) → LaunchblocksConfig` and `writeConfig(dir, config)` — write-only
- `LaunchblocksConfig` interface is already well-defined
- YAML library (`yaml` v2.5.1) supports both serialization and parsing
- No config reading or validation exists anywhere

### Implementation Plan

#### 2.1 Create config reader

New file: `src/generator/config-reader.ts`

```typescript
export async function readConfig(configPath: string): Promise<LaunchblocksConfig>
```

1. Read and parse `launchblocks.config.yaml` using the `yaml` library
2. Validate the parsed object against `LaunchblocksConfig` shape
3. Return the validated config or throw descriptive errors for missing/invalid fields

#### 2.2 Add config validation

Add a `validateConfig(config: unknown): LaunchblocksConfig` function that checks:

- Required fields present: `app_name`, `roles`, `owner_role`, `default_role`, `llm_providers`, `ai_tool`
- At least 2 roles
- Owner role exists in roles list
- Default role exists in roles list
- Providers are from the known set
- AI tool is valid
- Permissions are from the known set

Use plain TypeScript type guards (no Zod dependency — keep it lightweight).

#### 2.3 Add `--config` flag to init command

```
launchblocks init --config ./launchblocks.config.yaml
```

When passed:
1. Read and validate the config file
2. Skip the interview entirely
3. Regenerate all output files from the config
4. Useful for: editing YAML manually → regenerating, or sharing configs across projects

#### 2.4 Auto-detect existing config

When `launchblocks init` is run in a directory that already contains `launchblocks/launchblocks.config.yaml`:

1. Detect the existing config
2. Ask: "Found existing config. Regenerate from it, or start fresh?"
3. If regenerate: read config → skip interview → regenerate all files
4. If start fresh: run normal interview flow (overwriting)

### Files Changed

| File | Change |
|------|--------|
| `src/generator/config-reader.ts` | **New** — readConfig, validateConfig |
| `src/commands/init.ts` | Add --config flag handling, auto-detect logic |
| `bin/launchblocks.ts` | Add `--config <path>` option |

### Acceptance Criteria

- [ ] `launchblocks init --config ./launchblocks.config.yaml` regenerates project from config
- [ ] Invalid YAML produces clear, actionable error messages
- [ ] Missing required fields are identified by name
- [ ] Running `init` in a directory with existing config triggers detection prompt
- [ ] Generated output from config file is identical to output from equivalent interview answers
- [ ] Config validation rejects unknown providers, invalid role names, missing owner role

---

## Phase 3: Output UX Polish

**Gaps addressed:** #5 (annotated file tree), spinners, next steps prominence
**Estimated scope:** `src/utils/logger.ts`, `src/generator/index.ts`, new spinner utility

### Problem

Generation happens silently with no progress feedback. The post-generation summary shows a flat file list with no context about what each file does. Next steps are printed in gray and are easy to miss.

### Current State

- `src/generator/index.ts` runs 4 renderers sequentially with no progress output
- `src/utils/logger.ts` `summary()` method lists files via `fileCreated(path)` — gray text, no descriptions
- Next steps are plain `info()` calls (gray text)
- No spinner, progress bar, or animation anywhere in the codebase
- Chalk is already a dependency (v5.3.0)

### Implementation Plan

#### 3.1 Add spinner during generation

Add a lightweight spinner utility (use `ora` package or build a minimal one with Chalk):

```
◆ Generating project files...
  ⠋ Rendering module specs...
  ✓ 7 module specs
  ⠋ Rendering SQL migrations...
  ✓ 4 SQL migrations
  ⠋ Rendering context files...
  ✓ Master spec + CLAUDE.md + 3 references
  ⠋ Writing config...
  ✓ launchblocks.config.yaml

✅ Created 16 files in launchblocks/
```

Each renderer call in `generateProject()` gets wrapped with a spinner start/stop.

#### 3.2 Replace flat file list with annotated tree

Replace the current flat list in `summary()` with a tree view including descriptions:

```
launchblocks/
├── launchblocks.config.yaml           Your project configuration
├── LaunchBlocks_implementation.md     Master specification (all 7 modules)
├── CLAUDE.md                          AI tool context for Claude Code
├── specs/
│   ├── 01-project-setup.md            Framework scaffolding & env vars
│   ├── 02-database.md                 Schema design & RLS policies
│   ├── 03-authentication.md           Signup, login, OAuth flows
│   ├── 04-user-management.md          User CRUD & approval workflow
│   ├── 05-llm-gateway.md             Python microservice & Celeste SDK
│   ├── 06-prompt-management.md        Prompt template CRUD & versioning
│   └── 07-llm-audit.md               Audit log & cost tracking
├── schemas/
│   ├── migrations/
│   │   ├── 001_roles_and_permissions.sql
│   │   ├── 002_users_and_profiles.sql
│   │   ├── 003_prompt_templates.sql
│   │   └── 004_llm_audit_log.sql
│   └── sample-env.md                 Environment variable reference
└── references/
    ├── supabase-auth-patterns.md      Auth code examples
    ├── vercel-deploy-checklist.md     Deployment checklist
    └── llm-pricing-table.md          LLM model pricing data
```

Build a `treeView(files: FileEntry[])` function in `logger.ts` where `FileEntry = { path: string, description: string }`. The file descriptions come from a static map (each file's purpose is known at generation time).

#### 3.3 Make next steps prominent and copy-pasteable

Replace gray `info()` calls with a styled box:

```
┌─────────────────────────────────────────────────┐
│  Next steps:                                     │
│                                                  │
│  1. cd launchblocks                              │
│  2. Open your project in Claude Code             │
│  3. Tell Claude:                                 │
│                                                  │
│     Read LaunchBlocks_implementation.md           │
│     and implement all 7 modules                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

Commands rendered in bold/cyan so they stand out. The box uses Unicode box-drawing characters.

#### 3.4 Add file count and summary metrics

After the tree view, add a one-line summary:

```
Created 16 files (7 specs, 4 migrations, 3 references, 2 context files)
```

### Files Changed

| File | Change |
|------|--------|
| `src/utils/logger.ts` | Add `treeView()`, `nextStepsBox()`, update `summary()` |
| `src/utils/spinner.ts` | **New** — minimal spinner utility (or add `ora` dependency) |
| `src/generator/index.ts` | Wrap renderer calls with spinner start/stop |
| `package.json` | Add `ora` dependency (if using external spinner) |

### Acceptance Criteria

- [ ] Generation shows a spinner for each rendering phase
- [ ] Post-generation summary displays an annotated file tree with descriptions
- [ ] Tree uses proper box-drawing characters (├── └──)
- [ ] Next steps are displayed in a prominent styled box
- [ ] Commands in next steps are visually distinct (bold or colored)
- [ ] Summary line shows total file count with breakdown by category
- [ ] All output looks correct in standard 80-column terminal

---

## Phase 4: Spec Quality Enhancement

**Gaps addressed:** #2 (task decomposition), #8 (test specifications)
**Estimated scope:** All 7 templates in `src/templates/specs/`, `src/generator/template-utils.ts`

### Problem

AI agents perform dramatically better with numbered, ordered tasks and clear acceptance criteria. Current specs describe *what* to build but not the *steps* to build it or *how* to verify it's done. GitHub Spec Kit and Tessl both demonstrate this pattern.

### Current State

- 7 spec templates in `src/templates/specs/` use numbered sections (1.1, 1.2, etc.) but no granular tasks
- Specs describe features and show code examples but have no acceptance criteria
- No test definitions exist — no way to know when a module is "done"
- Handlebars helpers are minimal (`eq`, `neq`, `includes`, `join`, `uppercase`, `ifCond`)

### Implementation Plan

#### 4.1 Add task decomposition to each spec template

For each of the 7 spec templates, add a `## Tasks` section at the end with numbered, ordered implementation tasks. Each task should be:

- **Numbered** with the module prefix (e.g., Task 3.1, 3.2, 3.3 for Module 3)
- **Sequentially ordered** — later tasks depend on earlier ones
- **Actionable** — starts with a verb, describes a concrete output
- **Scoped** — small enough to verify independently

Example for `03-authentication.md`:

```markdown
## Implementation Tasks

Complete these tasks in order. Each task builds on the previous ones.

### Task 3.1: Configure Supabase Auth Client
Create the Supabase client initialization with auth helpers.
**Verify:** Import the client in a test page and confirm `supabase.auth.getSession()` returns without error.

### Task 3.2: Build Signup Form
Create a signup page with email/password form and validation.
**Verify:** Submit the form and confirm a new user appears in Supabase Auth dashboard.

### Task 3.3: Build Login Form
Create a login page that authenticates against Supabase Auth.
**Verify:** Log in with the user created in Task 3.2 and confirm session is established.

### Task 3.4: Implement Session Middleware
{{#if require_approval}}
Add middleware that checks both auth session AND approval status.
**Verify:** A pending_approval user is redirected to a waiting page after login.
{{else}}
Add middleware that checks auth session on protected routes.
**Verify:** An unauthenticated request to /dashboard redirects to /login.
{{/if}}

### Task 3.5: Add Password Reset Flow
...
```

#### 4.2 Add test specifications to each spec template

For each spec template, add a `## Test Specifications` section with concrete test definitions:

```markdown
## Test Specifications

### Unit Tests
- [ ] `has_permission()` returns true for owner role with any permission
- [ ] `has_permission()` returns false for user role with manage_users
- [ ] Signup trigger creates user_profiles row with correct default_role

### Integration Tests
- [ ] New user signup → profile created → role assigned → permissions enforced
- [ ] Admin changes user role → permissions update immediately
{{#if require_approval}}
- [ ] New user signup → status is pending_approval → cannot access protected routes
- [ ] Admin approves user → status changes to active → user can access protected routes
{{/if}}

### E2E Tests
- [ ] Complete signup → login → access dashboard → logout flow
- [ ] Admin approves new user → user receives access
```

Use Handlebars conditionals to include role-specific and approval-specific test cases.

#### 4.3 Add task-related Handlebars helpers

Add to `src/generator/template-utils.ts`:

- `taskId` helper: generates task IDs like `3.1`, `3.2` based on module number and index
- `verifyStep` helper: wraps verification text in a consistent format

#### 4.4 Update the master spec template

Update `src/templates/ai-context.md.hbs` to reference the new task structure:

```markdown
Each module spec contains:
- Feature descriptions and requirements
- Implementation tasks (numbered, ordered — complete in sequence)
- Test specifications (unit, integration, E2E)

Start with Module 1 tasks, then proceed to Module 2, and so on.
```

### Files Changed

| File | Change |
|------|--------|
| `src/templates/specs/01-project-setup.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/specs/02-database.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/specs/03-authentication.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/specs/04-user-management.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/specs/05-llm-gateway.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/specs/06-prompt-management.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/specs/07-llm-audit.md.hbs` | Add Tasks + Test Specs sections |
| `src/templates/ai-context.md.hbs` | Reference new task/test structure |
| `src/generator/template-utils.ts` | Add task-related helpers |

### Acceptance Criteria

- [ ] Every spec template has a numbered `## Implementation Tasks` section
- [ ] Tasks are sequentially ordered and each starts with an action verb
- [ ] Each task has a `**Verify:**` step describing how to confirm completion
- [ ] Every spec template has a `## Test Specifications` section
- [ ] Test specs are organized into Unit / Integration / E2E categories
- [ ] Conditional Handlebars blocks include role-specific and approval-specific tests
- [ ] Master spec references the task-driven workflow
- [ ] All templates render without errors (existing test passes)

---

## Phase 5: Prompt Library Migration

**Gaps addressed:** inquirer → @clack/prompts
**Estimated scope:** `src/interview/runner.ts`, all 8 question files, `src/setup/guide.ts`, `package.json`

### Problem

`inquirer` (v9.3.7) produces functional but visually dated CLI prompts. `@clack/prompts` is the modern standard (used by create-svelte, Astro, etc.) with better visual design — grouped prompts, styled cancel handling, intro/outro banners, and a spinner API built in.

### Current State

- `inquirer` is used in every file under `src/interview/questions/` and in `src/setup/guide.ts`
- Prompt types used: `list`, `input`, `confirm`, `checkbox`
- Some questions have validation functions and transformers
- `inquirer` v9 uses ESM-compatible `@inquirer/prompts` under the hood

### Implementation Plan

#### 5.1 Install @clack/prompts and remove inquirer

```bash
npm install @clack/prompts
npm uninstall inquirer @types/inquirer
```

#### 5.2 Map inquirer prompt types to @clack equivalents

| inquirer | @clack/prompts | Notes |
|----------|---------------|-------|
| `list` | `select` | Same behavior, better visuals |
| `input` | `text` | Same behavior |
| `confirm` | `confirm` | Same behavior |
| `checkbox` | `multiselect` | Same behavior, better visuals |
| (none) | `intro` / `outro` | Replace custom banner |
| (none) | `spinner` | Replace Phase 3 spinner if not yet done |
| (none) | `group` | Can group related prompts |
| (none) | `isCancel` | Graceful Ctrl+C handling |

#### 5.3 Rewrite each question file

Convert each file in `src/interview/questions/` from inquirer to @clack/prompts:

**Before (inquirer):**
```typescript
const { aiTool } = await inquirer.prompt([{
  type: "list",
  name: "aiTool",
  message: "Which AI coding tool will you use?",
  choices: [
    { name: "Claude Code", value: "claude" },
    { name: "Cursor", value: "cursor" },
  ]
}]);
```

**After (@clack/prompts):**
```typescript
const aiTool = await select({
  message: "Which AI coding tool will you use?",
  options: [
    { label: "Claude Code", value: "claude" },
    { label: "Cursor", value: "cursor" },
  ]
});
if (isCancel(aiTool)) { cancel("Operation cancelled."); process.exit(0); }
```

#### 5.4 Replace banner with @clack intro/outro

Replace the custom `logger.banner()` with `@clack/prompts` `intro()`:

```typescript
intro("Launchblocks — Spec-Driven AI App Foundation");
```

Replace summary ending with `outro()`:

```typescript
outro("Project generated! See next steps above.");
```

#### 5.5 Rewrite MCP setup guide

Convert `src/setup/guide.ts` prompts from inquirer to @clack/prompts.

#### 5.6 Handle cancellation gracefully

All `@clack/prompts` calls can return a cancel symbol. Wrap every prompt with `isCancel()` check to exit gracefully instead of throwing.

### Files Changed

| File | Change |
|------|--------|
| `package.json` | Add @clack/prompts, remove inquirer + @types/inquirer |
| `src/interview/questions/ai-tool.ts` | Rewrite with select() |
| `src/interview/questions/roles.ts` | Rewrite with select() + text() |
| `src/interview/questions/permissions.ts` | Rewrite with multiselect() |
| `src/interview/questions/signup.ts` | Rewrite with confirm() |
| `src/interview/questions/admin-access.ts` | Rewrite with confirm() + multiselect() |
| `src/interview/questions/llm-access.ts` | Rewrite with select() + multiselect() |
| `src/interview/questions/providers.ts` | Rewrite with multiselect() |
| `src/interview/questions/app-info.ts` | Rewrite with text() |
| `src/interview/runner.ts` | Update to use @clack intro + group flow |
| `src/setup/guide.ts` | Rewrite prompts with @clack |
| `src/utils/logger.ts` | Replace banner() with intro(), update summary to use outro() |

### Acceptance Criteria

- [ ] `inquirer` fully removed from `package.json` and all source files
- [ ] All 8 interview questions work with @clack/prompts
- [ ] MCP setup prompts work with @clack/prompts
- [ ] Ctrl+C at any prompt exits gracefully with a message (no stack trace)
- [ ] Visual output matches @clack styling (dotted lines, colored indicators)
- [ ] Banner uses `intro()`, final message uses `outro()`
- [ ] All validation functions still work (role names, app name, etc.)
- [ ] Interview flow is functionally identical to before (same questions, same logic)

---

## Phase 6: Incremental Commands

**Gaps addressed:** #6 (`launchblocks add` command)
**Depends on:** Phase 2 (config reuse — needs config reader)
**Estimated scope:** New command file, config updater, selective regeneration

### Problem

Launchblocks only supports greenfield projects. After initial generation, there's no way to add a new role, add a new LLM provider, or extend the project without re-running `init` from scratch.

### Current State

- Only one command exists: `init`
- Config is generated but never read back (Phase 2 fixes this)
- Generators are monolithic — they regenerate all files, not individual ones
- No mechanism for partial/selective regeneration

### Implementation Plan

#### 6.1 Create `launchblocks add` command with subcommands

```
launchblocks add role <name> [--permissions <list>] [--owner] [--default]
launchblocks add provider <name>
launchblocks add module <name>       # future: billing, notifications, etc.
```

#### 6.2 Implement `add role`

1. Read existing config (uses Phase 2's `readConfig()`)
2. Validate the new role doesn't already exist
3. Prompt for permissions (or accept via `--permissions` flag)
4. Update the config object: add role to `roles[]`, update YAML
5. Regenerate affected files:
   - `launchblocks.config.yaml` (updated)
   - SQL migrations that reference roles (001, 002)
   - Spec files that reference roles (02, 03, 04)
   - Master spec (re-render)

#### 6.3 Implement `add provider`

1. Read existing config
2. Validate the provider is known and not already added
3. Update config: add to `llm_providers[]`
4. Regenerate affected files:
   - `launchblocks.config.yaml`
   - `sample-env.md`
   - Spec 05 (LLM Gateway)
   - Master spec

#### 6.4 Implement selective regeneration

Refactor `src/generator/index.ts` to support regenerating subsets of files:

```typescript
type GenerateScope = "all" | "config" | "specs" | "sql" | "context" | "references";

export async function generateProject(
  outputDir: string,
  config: LaunchblocksConfig,
  options?: { dryRun?: boolean; scope?: GenerateScope[] }
): Promise<string[]>
```

The `add` commands use `scope` to regenerate only the files affected by the change.

### Files Changed

| File | Change |
|------|--------|
| `bin/launchblocks.ts` | Add `add` command with `role` and `provider` subcommands |
| `src/commands/add.ts` | **New** — handles `add role` and `add provider` logic |
| `src/generator/config-reader.ts` | Already exists from Phase 2 |
| `src/generator/config-writer.ts` | Add `updateConfig()` for merging changes |
| `src/generator/index.ts` | Add `scope` option for selective regeneration |

### Acceptance Criteria

- [ ] `launchblocks add role editor --permissions manage_prompts,view_audit_log` adds a role and regenerates affected files
- [ ] `launchblocks add provider anthropic` adds a provider and regenerates affected files
- [ ] Existing file content is preserved where not affected by the change
- [ ] Adding a duplicate role produces a clear error
- [ ] Adding an unknown provider produces a clear error
- [ ] Config YAML is updated in-place (not overwritten entirely)
- [ ] `launchblocks add --help` shows available subcommands

---

## Phase 7: Billing Module

**Gaps addressed:** #7 (Billing/Stripe module)
**Estimated scope:** New spec template, new SQL template, updates to master spec and interview

### Problem

Every SaaS boilerplate competitor (Supastarter, Makerkit, ShipFast) includes a payments/billing module. Launchblocks doesn't, which is a significant gap for the primary use case of AI-powered SaaS apps.

### Current State

- 7 modules exist: project setup, database, auth, user management, LLM gateway, prompt management, LLM audit
- No billing, payment, or subscription concepts anywhere
- Interview doesn't ask about billing
- SQL migrations don't include billing tables

### Implementation Plan

#### 7.1 Add billing interview question

Add Question 9 (or insert between existing questions):

```
Do you want to include a billing module? (Stripe)
  ○ Yes — include Stripe billing with subscription plans
  ○ No — skip billing for now
```

If yes, follow up with:

```
Which billing model?
  ○ Subscription (monthly/yearly plans)
  ○ Usage-based (pay per LLM call)
  ○ Both
```

#### 7.2 Create spec template: `08-billing.md.hbs`

New spec covering:

- Stripe integration (API keys, webhook setup)
- Subscription plans table (free, pro, enterprise)
- Checkout session creation
- Webhook handling (subscription created, updated, cancelled, payment failed)
- Customer portal for self-service management
- Usage tracking (if usage-based billing selected)
- Billing page UI
- Plan gating (restrict features by plan)

Include **Implementation Tasks** and **Test Specifications** sections (consistent with Phase 4).

#### 7.3 Create SQL template: `005_billing.sql.hbs`

New migration with tables:

- `subscription_plans` — id, name, stripe_price_id, features JSONB, limits JSONB
- `user_subscriptions` — user_id, plan_id, stripe_subscription_id, status, current_period_start/end
- `billing_events` — id, user_id, event_type, stripe_event_id, data JSONB, created_at
- RLS policies scoped to user (users can only see their own subscription)
- Seed data for default plans (free, pro, enterprise)

#### 7.4 Update master spec and context files

- Add Module 8: Billing to `ai-context.md.hbs`
- Update tool-specific context files to reference 8 modules
- Add Stripe env vars to `sample-env.md.hbs`

#### 7.5 Update config and types

- Add `include_billing: boolean` and `billing_model: "subscription" | "usage" | "both"` to `LaunchblocksConfig`
- Update `InterviewAnswers` type
- Update config writer and template context builder

#### 7.6 Conditionally include billing

All billing content is wrapped in `{{#if include_billing}}` blocks so it only appears when the user opts in. Non-billing projects remain unchanged.

### Files Changed

| File | Change |
|------|--------|
| `src/interview/questions/billing.ts` | **New** — billing interview question |
| `src/interview/runner.ts` | Add billing question (Q9) |
| `src/interview/types.ts` | Add billing fields to InterviewAnswers |
| `src/templates/specs/08-billing.md.hbs` | **New** — billing spec template |
| `src/templates/schemas/005_billing.sql.hbs` | **New** — billing SQL migration |
| `src/templates/schemas/sample-env.md.hbs` | Add Stripe env vars |
| `src/templates/ai-context.md.hbs` | Add Module 8 reference |
| `src/generator/config-writer.ts` | Add billing fields |
| `src/generator/template-utils.ts` | Add billing context |
| `src/generator/spec-renderer.ts` | Add billing spec rendering |
| `src/generator/sql-renderer.ts` | Add billing SQL rendering |

### Acceptance Criteria

- [ ] Billing question appears in interview when running `launchblocks init`
- [ ] Selecting "No" produces identical output to current behavior (no regressions)
- [ ] Selecting "Yes" generates `08-billing.md` spec and `005_billing.sql` migration
- [ ] SQL migration includes subscription_plans, user_subscriptions, billing_events tables
- [ ] RLS policies restrict billing data to the owning user
- [ ] Master spec references Module 8 when billing is enabled
- [ ] sample-env.md includes STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
- [ ] `--defaults` flag (from Phase 1) defaults billing to off

---

## Phase 8: Branding & Distribution

**Gaps addressed:** #10 (SDD positioning), `create-launchblocks` npm alias
**Estimated scope:** `package.json`, README, marketing copy, npm configuration

### Problem

Launchblocks was doing spec-driven development (SDD) before the term went mainstream. It's not positioned in this category, missing discoverability. Also, the `npm create` convention (`create-<name>`) is not supported.

### Current State

- Package name: `launchblocks`
- No mention of "spec-driven development" or "SDD" in README or CLI output
- No `create-launchblocks` alias
- CLI banner says "Spec-Driven AI App Foundation" (close, but not SDD-branded)

### Implementation Plan

#### 8.1 Create `create-launchblocks` npm package

Create a minimal wrapper package that delegates to the main package:

**Option A: Separate package (recommended for npm create convention)**

Create a `create-launchblocks` package on npm with:
```json
{
  "name": "create-launchblocks",
  "version": "0.1.0",
  "bin": { "create-launchblocks": "./index.js" },
  "dependencies": { "launchblocks": "^0.1.0" }
}
```

`index.js` simply re-exports or delegates to `launchblocks init`.

This enables: `npm create launchblocks@latest` and `npx create-launchblocks`

**Option B: Add bin alias in main package**

Add to the main `package.json`:
```json
"bin": {
  "launchblocks": "./dist/bin/launchblocks.js",
  "create-launchblocks": "./dist/bin/launchblocks.js"
}
```

Option B is simpler but `npm create` convention expects a separate package.

#### 8.2 Update README with SDD positioning

Add a section near the top:

```markdown
## Spec-Driven Development

Launchblocks is a **Spec-Driven Development (SDD)** tool. Instead of generating
code directly, it generates *specifications* that AI coding tools implement.
This approach is now recognized by Thoughtworks Technology Radar and endorsed
by Martin Fowler and GitHub as a best practice for AI-assisted development.

Why SDD?
- AI agents perform better with structured specs than ad-hoc prompts
- Specs are reviewable, version-controllable, and tool-agnostic
- You keep full control over the architecture — the AI handles implementation
```

#### 8.3 Update CLI banner and description

Update `src/utils/logger.ts` banner:

```
Launchblocks — Spec-Driven Development for AI-Powered Apps
```

Update `package.json` description:

```json
"description": "Spec-Driven Development (SDD) tool for AI-powered applications"
```

Update Commander.js description in `bin/launchblocks.ts`.

#### 8.4 Add npm keywords for discoverability

Update `package.json` keywords:

```json
"keywords": [
  "sdd", "spec-driven-development", "ai", "llm", "scaffold", "cli",
  "supabase", "vercel", "vibe-coding", "launchblocks", "specification",
  "ai-agent", "cursor", "claude", "codex", "gemini"
]
```

### Files Changed

| File | Change |
|------|--------|
| `package.json` | Update description, keywords, optionally add bin alias |
| `README.md` | Add SDD section, update positioning |
| `src/utils/logger.ts` | Update banner text |
| `bin/launchblocks.ts` | Update Commander description |
| `create-launchblocks/` | **New** (if Option A) — separate npm package |

### Acceptance Criteria

- [ ] `npm create launchblocks` or `npx create-launchblocks` works
- [ ] README includes SDD section explaining the approach
- [ ] CLI banner references Spec-Driven Development
- [ ] npm keywords include SDD-related terms
- [ ] Package description mentions SDD
- [ ] All existing functionality unchanged

---

## Execution Order Recommendation

```
Priority  Phase  Effort   Impact   Dependencies
───────── ────── ──────── ──────── ────────────
  1       P1     Medium   High     None — foundational
  2       P3     Small    High     None — quick wins
  3       P4     Medium   High     None — spec quality
  4       P2     Small    Medium   None — enables P6
  5       P5     Medium   Medium   None — UX upgrade
  6       P8     Small    Medium   None — branding
  7       P6     Medium   Medium   Requires P2
  8       P7     Large    High     None — new feature
```

**Recommended first sprint:** Phases 1 + 3 in parallel (CLI flags + output polish). These deliver the highest immediate user impact and create the foundation for everything else.

**Recommended second sprint:** Phases 4 + 2 in parallel (spec quality + config reuse). Spec quality is the biggest competitive differentiator. Config reuse unblocks Phase 6.

**Recommended third sprint:** Phases 5 + 8 in parallel (clack migration + branding). Polish and positioning.

**Recommended fourth sprint:** Phase 6 (incremental commands). Depends on Phase 2.

**Recommended fifth sprint:** Phase 7 (billing module). Largest scope, highest standalone value.
