# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LaunchBlocks is a **Spec-Driven Development (SDD)** CLI tool. It interviews users about their app requirements, then generates project specifications, SQL migrations, and AI context files — blueprints for AI coding tools (Claude Code, Cursor, Codex, Gemini) to implement. It does **not** generate application code.

## Build & Development Commands

```bash
npm run build       # Compile TS with tsup + copy src/templates/ to dist/templates/
npm run dev         # Watch mode (tsup --watch)
npm start           # Run the built CLI (node dist/bin/launchblocks.js)
```

### Running Tests

```bash
npx tsx test/test-generator.ts
```

No test framework (Jest/Mocha) — the test is a programmatic script that runs the generator with multiple configurations and verifies all expected files are created and templates render without unresolved markers.

### Running the CLI Locally

```bash
npm run build && node dist/bin/launchblocks.js init
```

## Architecture

The CLI operates in three phases: **Interview → Generation → MCP Setup**.

### Data Flow

```
InterviewAnswers → buildConfig() → LaunchblocksConfig (YAML) → buildTemplateContext() → TemplateContext → Renderers → Output files
```

### Key Directories

- **`bin/launchblocks.ts`** — CLI entry point (Commander.js). Defines `init` and `add` commands with all CLI flags.
- **`src/commands/`** — Command handlers. `init.ts` orchestrates the full pipeline; `add.ts` handles `add role` and `add provider`.
- **`src/interview/`** — 8-question interactive interview using `@clack/prompts`. `runner.ts` orchestrates, individual questions live in `questions/`.
- **`src/generator/`** — Core generation logic:
  - `index.ts` — Orchestrator, runs 5 phases (config, context, references, specs, sql)
  - `config-writer.ts` — `InterviewAnswers` → `LaunchblocksConfig` → YAML serialization
  - `config-reader.ts` — YAML → `LaunchblocksConfig` parsing + validation (for `--config` flag)
  - `template-utils.ts` — Handlebars helper registration (`eq`, `neq`, `includes`, `join`, `uppercase`, `ifCond`, `taskId`, `verifyStep`) + `buildTemplateContext()`
  - `spec-renderer.ts`, `sql-renderer.ts`, `context-renderer.ts` — Render modules specs, SQL migrations, and tool context files respectively
- **`src/templates/`** — Handlebars `.hbs` templates. Shipped with the package (copied to `dist/templates/` at build time). Contains `specs/`, `schemas/`, and `references/` subdirectories.
- **`src/setup/`** — MCP server detection and installation for Supabase/Vercel.
- **`src/utils/`** — Logger, input validation, slug conversion, shell exec helpers.

### Template System

All output is rendered via **Handlebars**. Templates live in `src/templates/` and are copied to `dist/templates/` during build. Custom helpers are registered in `template-utils.ts`. The `TemplateContext` object (built from `LaunchblocksConfig`) provides flattened data structures optimized for template consumption (e.g., `permissions_flat[]`, `role_permission_map`, `providers_display[]`).

### Scoped Regeneration

The `GenerateScope` enum in `src/generator/index.ts` allows partial regeneration. The `add role` and `add provider` commands use this to regenerate only config, context, specs, and sql without re-running the full pipeline.

## Technical Conventions

- **ESM-only** — `"type": "module"` in package.json, all imports use `.js` extensions
- **Node >= 18** required
- **tsup** for bundling (two entries: CLI with shebang injection, library with `.d.ts`)
- No linter or formatter configured
- **Monorepo**: `create-launchblocks/` is a separate npm package that wraps `npx launchblocks init`

## CLI Commands

- `launchblocks init` — Full interview + generation pipeline. Key flags: `--defaults`, `--dry-run`, `--config <path>`, `--skip-mcp`, `--include-billing`
- `launchblocks add role <name>` — Add a role to existing config. Triggers scoped regeneration.
- `launchblocks add provider <name>` — Add an LLM provider to existing config.
