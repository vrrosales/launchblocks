# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**
- TypeScript 5.6.0 - All source code, CLI tool, and build configuration
- JavaScript (Node.js) - Runtime execution for compiled output

**Secondary:**
- Handlebars 4.7.8 - Template engine for spec and schema generation
- YAML 2.5.1 - Configuration file format
- SQL - Schema templates for database generation (rendered from Handlebars)
- Markdown - Documentation and spec generation

## Runtime

**Environment:**
- Node.js 18+ (specified in `package.json` engines field)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Commander.js 12.1.0 - CLI argument parsing and command routing

**UI/Prompts:**
- @clack/prompts 1.0.1 - Interactive CLI prompts and UI
- chalk 5.3.0 - Terminal color and styling
- ora 9.3.0 - Spinner and loading indicators

**Build/Dev:**
- tsup 8.3.0 - TypeScript bundler for ESM output
- TypeScript 5.6.0 - Type checking and compilation

**Templating:**
- Handlebars 4.7.8 - Template rendering for generated spec files

## Key Dependencies

**Critical:**
- fs-extra 11.2.0 - File system operations with enhanced utilities
- @types/fs-extra 11.0.4 - Type definitions for fs-extra
- @types/node 20.17.0 - Node.js type definitions
- yaml 2.5.1 - YAML parsing and stringification

**Infrastructure:**
- commander 12.1.0 - CLI command framework
- @clack/prompts 1.0.1 - Interactive prompts for user input
- chalk 5.3.0 - Terminal color styling
- ora 9.3.0 - Progress spinner management
- handlebars 4.7.8 - Template engine for Handlebars syntax

## Configuration

**Environment:**
- Configuration stored in `launchblocks.config.yaml` (generated during init)
- Environment variables required per LLM provider (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
- No `.env` file pattern used; configuration is explicit in interviews and config files

**Build:**
- `tsconfig.json` - TypeScript compilation configuration
  - Target: ES2022
  - Module: ESNext with bundler resolution
  - Strict mode enabled
  - Source maps and declaration maps generated
- `tsup.config.ts` - Build tool configuration
  - Two entry points: CLI (`bin/launchblocks.ts`) and library (`src/index.ts`)
  - ESM format only
  - Target: Node 18
  - Banner: `#!/usr/bin/env node` for executable CLI
  - Declarations generated for library exports

## Compilation Targets

**Output:**
- CLI binary: `dist/bin/launchblocks.js` (executable with shebang)
- Library exports: `dist/index.ts` (with `.d.ts` type declarations)
- Templates copied to `dist/templates/` during build

**Entry Point (package.json bin):**
- `launchblocks` command maps to `./dist/bin/launchblocks.js`

## Platform Requirements

**Development:**
- Node.js 18 or higher
- npm package manager
- TypeScript compiler (devDependency)
- File system access for template generation

**Production:**
- Node.js 18+ runtime
- No external service dependencies for CLI itself
- Optional integrations with:
  - Supabase (via MCP server at https://mcp.supabase.com/mcp)
  - Vercel (via MCP server at https://mcp.vercel.com)
  - LLM API endpoints (OpenAI, Anthropic, Google, Mistral, Cohere, xAI, DeepSeek, Groq)

## Build Output Structure

**Generated Files:**
- `dist/bin/launchblocks.js` - Compiled CLI entry point with executable shebang
- `dist/index.js` - Main library export
- `dist/index.d.ts` - Type definitions for library export
- `dist/templates/` - Copied Handlebars templates for spec generation
- Source maps (`.js.map` files) for debugging

---

*Stack analysis: 2026-03-01*
