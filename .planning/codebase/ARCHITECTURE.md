# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Spec-Driven Development (SDD) pipeline with modular generation stages.

**Key Characteristics:**
- Command-driven CLI with interactive multi-step interview flow
- Template-based code generation using Handlebars
- Phased generation pipeline with scoped re-generation capability
- Configuration-as-code YAML format for projects
- Layered architecture separating concerns: interview → config → generation → setup

## Layers

**CLI Commands:**
- Purpose: Entry points for user interactions (init, add)
- Location: `src/commands/`
- Contains: Command handlers that orchestrate workflows
- Depends on: Interview, Generator, Setup, Logger
- Used by: `bin/launchblocks.ts` CLI entry point

**Interview (Q&A):**
- Purpose: Collect user preferences through interactive prompts
- Location: `src/interview/`
- Contains: Question modules, answer types, interview orchestrator
- Depends on: @clack/prompts, Validation utilities
- Used by: init command to generate InterviewAnswers

**Configuration:**
- Purpose: Normalize user answers into canonical config format
- Location: `src/generator/config-writer.ts`, `config-reader.ts`
- Contains: Config types (LaunchblocksConfig), builders, readers, validators
- Depends on: yaml, fs-extra
- Used by: Commands and generators

**Generation Pipeline:**
- Purpose: Render templates into project files in stages
- Location: `src/generator/`
- Contains: Master orchestrator (index.ts), renderers (spec, SQL, context, references)
- Depends on: Handlebars, config, templates
- Used by: init and add commands
- Stages:
  1. Config YAML write (`writeConfig`)
  2. Context files (LaunchBlocks_implementation.md + tool-specific files)
  3. Reference files (static copies)
  4. Module specs (templated markdown specifications)
  5. SQL migrations and sample env

**Template System:**
- Purpose: Template context building and Handlebars helpers
- Location: `src/generator/template-utils.ts`
- Contains: Helper registrations (eq, neq, includes, join, ifCond, etc.), context builder
- Depends on: Handlebars
- Used by: All renderer modules

**Setup (MCP Servers):**
- Purpose: Detect and configure AI tool integrations (Claude, Cursor, Codex, Gemini)
- Location: `src/setup/`
- Contains: Detection logic, interactive setup guide
- Depends on: fs-extra, home directory access
- Used by: init command after generation

**Utilities:**
- Purpose: Cross-cutting logging, validation, slugification, execution
- Location: `src/utils/`
- Contains: Logger (output formatting), validation rules, slug generation, shell exec
- Depends on: chalk, ora (spinner)
- Used by: All layers

## Data Flow

**Init Command (Primary Workflow):**

1. User runs `launchblocks init` with optional flags
2. Flags parsed → partial `InterviewAnswers` built in `buildAnswersFromFlags()`
3. **Auto-detect phase:** Check for existing `launchblocks/launchblocks.config.yaml`
   - If exists and not `--defaults`: offer regenerate vs. fresh
   - If exists and `--defaults`: skip to regenerate path
4. **Interview phase:** Run `runInterview()` with prefilled answers
   - Executes 9 question modules in sequence (roles, permissions, signup approval, admin access, LLM access, providers, app info, AI tool, billing)
   - Each question skipped if already in prefilled answers
   - Produces complete `InterviewAnswers`
5. **Config build:** Transform `InterviewAnswers` → `LaunchblocksConfig` via `buildConfig()`
   - Generates slug from app name
   - Normalizes role definitions
6. **Generation phase:** Call `generateProject()` with config
   - Default scope: all 5 phases (config, context, specs, sql, references)
   - Dry-run mode: generates to temp directory, measures sizes, cleans up
   - Real mode: writes to `./launchblocks/`
7. **Setup phase:** Run `runSetup()` (unless `--skip-mcp`)
   - Detects MCP server installations for selected AI tool
   - Offers interactive configuration guide if needed
8. **Summary:** Display file tree, stats, and next steps

**Add Command (Incremental Workflow):**

1. User runs `launchblocks add role <name>` or `launchblocks add provider <name>`
2. Validate name format
3. Read existing config from `launchblocks/launchblocks.config.yaml`
4. Modify config in memory (add role with permissions, or add provider)
5. Regenerate with scope: `["config", "context", "specs", "sql"]` (skip references)
6. Report updates

**State Management:**

- **Interview answers** held in memory during init, never persisted
- **Config YAML** is source of truth after generation, persisted in project root
- **Templates** rendered fresh on each generation (no incremental state)
- **Generated files** overwritten on regeneration (spec templates are deterministic)
- **MCP configuration** managed separately in user's AI tool config directories (~/.claude.json, .cursor/mcp.json, etc.)

## Key Abstractions

**InterviewAnswers:**
- Purpose: Structured representation of user choices from interview
- Location: `src/interview/types.ts`
- Contains: appName, roles, ownerRole, defaultRole, requireApproval, adminRoles, llmAccessRoles, llmProviders, aiTool, includeBilling, billingModel
- Used by: init command, buildConfig

**LaunchblocksConfig:**
- Purpose: Normalized, validated configuration for generation
- Location: `src/generator/config-writer.ts`
- Contains: app_name, slug, roles (flattened), owner_role, default_role, require_approval, admin_roles, llm_access_roles, llm_providers, ai_tool, include_billing, billing_model
- Used by: All generators, config-reader for validation

**DryRunFile:**
- Purpose: File metadata for preview mode
- Location: `src/generator/index.ts`
- Contains: path, size
- Used by: Dry-run preview output

**McpServerStatus:**
- Purpose: Detection result for AI tool MCP support
- Location: `src/setup/types.ts`
- Contains: installed, location (project/user), name
- Used by: Setup detection and guide

**Template Context:**
- Purpose: Data structure passed to Handlebars templates
- Location: Built in `buildTemplateContext()` from config
- Contains: Flattened permissions, role-permission summary, provider metadata (names, env vars, docs URLs), flags for conditional rendering
- Used by: All Handlebars renderers

## Entry Points

**CLI Binary:**
- Location: `bin/launchblocks.ts`
- Triggers: User runs `launchblocks init` or `launchblocks add`
- Responsibilities: Parse command structure using commander.js, dispatch to command handlers

**Init Command:**
- Location: `src/commands/init.ts`
- Triggers: `launchblocks init [options]`
- Responsibilities: Orchestrate interview → config → generation → setup flow

**Add Role Command:**
- Location: `src/commands/add.ts` (addRoleCommand)
- Triggers: `launchblocks add role <name> [options]`
- Responsibilities: Modify config, regenerate scoped files

**Add Provider Command:**
- Location: `src/commands/add.ts` (addProviderCommand)
- Triggers: `launchblocks add provider <name>`
- Responsibilities: Add LLM provider, regenerate scoped files

## Error Handling

**Strategy:** Fail-fast with descriptive messages to stderr, exit code 1.

**Patterns:**

- **Validation in interview:** Each question validates input synchronously (e.g., `validateRoles()`, `validateAppName()`)
- **Config validation:** `validateConfig()` in config-reader asserts all required fields and types via assertion functions (`assertString`, `assertBoolean`, `assertStringArray`)
- **CLI flag validation:** `buildAnswersFromFlags()` validates AI tool names, provider names, role format, length constraints before building answers
- **File I/O:** Wrapped in try-catch blocks in generateProject phases; failures logged with `failPhase()` and rethrown
- **User cancellation:** Prompts return `isCancel()` which triggers `cancel()` message and `process.exit(0)` (graceful)
- **Async errors:** Top-level try-catch in command handlers logs error message and exits with code 1

**No recovery:** Failed generation doesn't roll back; user must fix config and re-run.

## Cross-Cutting Concerns

**Logging:**
- Implementation: `src/utils/logger.ts` with chalk-based colored output
- Pattern: Structured methods (step, success, info, warn, error, phase, statusLine, dryRunSummary, summary)
- Usage: All layers log progress to stdout during init

**Validation:**
- Implementation: `src/utils/validation.ts` with helper functions
- Patterns: Synchronous validators return `string | true` (error message or validation passed); used in prompts and flag parsing
- Scope: Role names (lowercase, digits, underscores), app names (1-100 chars), comma-separated lists

**Template Rendering:**
- Implementation: Handlebars with custom helpers (eq, neq, includes, join, uppercase, ifCond, taskId, verifyStep)
- Pattern: Config → context builder → template compile → render → write
- Scope: All markdown specs, SQL migrations, AI tool context files, sample env

**Configuration Persistence:**
- Implementation: YAML serialization via `yaml` package
- Pattern: Config object → YAML string → file write
- Scope: Single launchblocks.config.yaml per project (read-modify-write in add commands)

**Spinner Feedback:**
- Implementation: `src/utils/spinner.ts` with ora spinner
- Pattern: `startPhase()`, `succeedPhase()`, `failPhase()` for visual feedback during generation
- Scope: Only in real mode (not dry-run)

---

*Architecture analysis: 2026-03-01*
