# Roadmap: VibeKit CLI Quality Audit

## Overview

This audit works bottom-up through VibeKit's pipeline: fix the type foundations and config validation first (leaf-level, no upstream dependencies), then harden CLI command behavior (depends on correct config), then verify template and SQL output correctness (depends on correct types flowing through the pipeline), and finally build automated test coverage that locks everything down against regressions. Each phase delivers a coherent, verifiable capability that the next phase builds on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation Hardening** - Replace unsafe type casts and manual validation with typed interfaces and error-accumulating validation (completed 2026-03-01)
- [ ] **Phase 2: CLI Hardening** - Fix graceful shutdown, flag combinations, and scoped regeneration so every CLI path behaves correctly
- [ ] **Phase 3: Template & SQL Correctness** - Ensure every generated spec and SQL migration is complete, valid, and safe to re-run
- [ ] **Phase 4: Test Coverage** - Build automated tests that prove correctness end-to-end and catch regressions

## Phase Details

### Phase 1: Foundation Hardening
**Goal**: The type system and config validation are trustworthy foundations -- types are sound, validation catches all errors at once, and cross-field consistency is enforced
**Depends on**: Nothing (leaf-level components with no upstream project dependencies)
**Requirements**: TYPE-01, TYPE-02, CFG-01, CFG-02
**Success Criteria** (what must be TRUE):
  1. Running the CLI with a config file containing multiple errors reports all errors in a single output, not one at a time
  2. A config with an invalid owner_role (not in the roles list) or invalid admin/LLM-access roles is rejected with a specific error message naming the invalid reference
  3. `buildTemplateContext()` returns a value that satisfies a named TypeScript interface, and the project compiles with `strict: true` and zero `as` casts in source files
  4. The project builds cleanly with `npm run build` after all type changes
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Define TemplateContext interface and refactor config validation to accumulate all errors
- [x] 01-02-PLAN.md -- Eliminate all unsafe `as` type casts across source files

### Phase 2: CLI Hardening
**Goal**: Every CLI command and flag combination produces correct output and handles cancellation gracefully instead of hard-exiting
**Depends on**: Phase 1 (config validation and types must be correct before CLI behavior can be verified)
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CFG-03
**Success Criteria** (what must be TRUE):
  1. Cancelling the interview at any question returns to the shell cleanly (no orphan files, no stack trace) with a cancellation message instead of a hard `process.exit(0)`
  2. Running `launchblocks init --defaults --roles "admin,user,moderator"` produces a config with exactly those three roles plus default values for all other fields
  3. Running `launchblocks add role analyst` on an existing project updates the config, specs, SQL, and context files -- and the result matches what `init` would produce with the role pre-included
  4. Running `launchblocks add provider anthropic` on an existing project updates all output files consistently, same as if the provider was included at init time
  5. The `add role` and `add provider` commands validate the mutated config before passing it to the generator, rejecting invalid additions (e.g., duplicate role name) with a clear error
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Replace all process.exit(0) with CancellationError throw pattern for graceful shutdown
- [ ] 02-02-PLAN.md -- Fix --defaults flag merging and add post-mutation validateConfig to add commands

### Phase 3: Template & SQL Correctness
**Goal**: Every generated spec and SQL migration is complete (no blank values from missing template variables), syntactically valid, and safe to re-run
**Depends on**: Phase 1 (typed template context prevents silent empty-string resolution), Phase 2 (CLI commands must work correctly to generate output for verification)
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04
**Success Criteria** (what must be TRUE):
  1. Generating output for a representative config produces specs and SQL with zero empty strings where a value was expected -- every Handlebars variable in every `.hbs` template resolves to a non-empty value
  2. Every generated SQL migration file parses as syntactically valid PostgreSQL (verified by a parser, not just eyeballing)
  3. SQL migrations include idempotency guards (IF NOT EXISTS, DROP POLICY IF EXISTS) so re-running them does not produce "already exists" errors
  4. Generating output with billing enabled for each billing model (usage, subscription, both) and with billing disabled produces correct conditional output -- no billing artifacts when disabled, correct model-specific tables when enabled
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md -- Add idempotency guards to all 5 SQL migration templates
- [ ] 03-02-PLAN.md -- Build template validation harness with libpg-query SQL parsing and multi-config coverage

### Phase 4: Test Coverage
**Goal**: Automated tests prove the CLI produces correct output for all supported configurations and catch regressions when code changes
**Depends on**: Phase 1, Phase 2, Phase 3 (tests verify fixed behavior -- the fixes must land before tests lock them down)
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Running `npm test` executes an integration test that invokes the built CLI binary end-to-end and verifies all expected output files are created with correct content
  2. Config validation tests cover edge cases: empty roles array, duplicate role names, invalid characters in names, missing required fields, and invalid cross-references (bad owner_role, bad admin role) -- each case produces a specific error message
  3. Golden file / snapshot tests capture expected output for at least 4 representative configurations (default, billing-usage, billing-subscription, multi-role) and fail if generated output changes unexpectedly
  4. All tests pass in CI (or local `npm test`) with zero manual intervention
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Hardening | 2/2 | Complete | 2026-03-01 |
| 2. CLI Hardening | 2/2 | Complete | 2026-03-01 |
| 3. Template & SQL Correctness | 0/2 | Planned | - |
| 4. Test Coverage | 0/0 | Not started | - |
