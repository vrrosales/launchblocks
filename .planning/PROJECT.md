# VibeKit CLI — Quality Audit & Gap Closure

## What This Is

VibeKit is a spec-driven launchpad for AI-powered applications. It's a CLI tool that interviews developers about their app requirements, then generates project specifications, SQL migrations, and AI context files — blueprints that any AI coding tool (Claude Code, Cursor, Codex, Gemini) can implement. It provides seven foundational modules (project setup, database, auth, user management, LLM gateway, prompt management, LLM audit trail) plus optional billing, so developers skip boilerplate and focus on unique product logic.

This project is a full quality audit of the existing VibeKit CLI: run it end-to-end, verify every generated artifact works as promised, and fix code quality issues — so the tool is shippable with confidence.

## Core Value

The generated specs must be complete, correct, and implementable by any AI coding tool regardless of stack. If the specs are wrong, nothing downstream works.

## Requirements

### Validated

- ✓ CLI interview flow collects app requirements (roles, permissions, providers, billing) — existing
- ✓ Config YAML generated from interview answers — existing
- ✓ 7 module spec templates rendered via Handlebars — existing
- ✓ 4-5 SQL migration templates rendered — existing
- ✓ AI tool context files generated (CLAUDE.md, .cursorrules, AGENTS.md, GEMINI.md) — existing
- ✓ MCP server detection and setup guide — existing
- ✓ `add role` and `add provider` incremental commands — existing
- ✓ `--defaults` and `--config` flags for non-interactive use — existing
- ✓ `--dry-run` preview mode — existing
- ✓ Optional billing module (Module 8) with gating — existing

### Active

- [ ] End-to-end CLI execution produces correct, complete output
- [ ] Generated specs are stack-agnostic and implementable
- [ ] Generated SQL migrations are valid and consistent with specs
- [ ] Interview flow handles all edge cases cleanly
- [ ] CLI flags work correctly in all combinations
- [ ] Add commands (role, provider) work correctly with scoped regeneration
- [ ] Type safety issues resolved (remove unsafe `as` casts)
- [ ] Process.exit cleanup — graceful cancellation instead of hard exits
- [ ] Config validation reports all errors at once, not one at a time
- [ ] Role/permission consistency enforced from a single source of truth
- [ ] Test coverage for config validation edge cases
- [ ] Test coverage for interview prefill combinations
- [ ] Branding consistency (LaunchBlocks → VibeKit naming throughout)

### Out of Scope

- New modules beyond the existing 7+1 — this is about quality, not features
- Stack-specific code generation — VibeKit generates specs, not code
- UI/web dashboard — CLI-only tool
- Plugin/extension system — premature for current stage

## Context

- Existing codebase with ~2,500 lines of TypeScript across CLI, interview, generator, and setup layers
- Codebase analysis (`.planning/codebase/`) identified: type safety issues, process.exit without cleanup, fragile state derivation, missing validation, test coverage gaps
- The tool was previously named "LaunchBlocks" — branding needs updating throughout
- Build uses tsup with ESM-only output targeting Node 18+
- Test suite is a single programmatic script (`test/test-generator.ts`), no test framework
- Templates are Handlebars `.hbs` files shipped with the npm package

## Constraints

- **Stack-agnostic output**: Specs must not assume any specific frontend/backend framework
- **No test framework**: Tests are programmatic scripts (not Jest/Mocha) — keep this pattern unless there's a strong reason to change
- **ESM-only**: All imports use `.js` extensions, `"type": "module"` in package.json
- **Node >= 18**: Minimum runtime requirement
- **Backwards compatibility**: Existing `launchblocks.config.yaml` files from users should still work

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full audit before shipping | Haven't used the CLI yet — need confidence it works | — Pending |
| Fix code quality + output quality | Both matter: broken CLI and broken specs are equally bad | — Pending |
| Stack-agnostic specs | VibeKit should work with any stack, not just Supabase+Next.js | — Pending |
| Keep programmatic test pattern | No test framework currently; adding one is out of scope unless needed | — Pending |

---
*Last updated: 2026-03-01 after initialization*
