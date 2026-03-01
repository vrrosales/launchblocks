---
phase: 02-cli-hardening
plan: 02
subsystem: cli
tags: [flag-merging, config-validation, add-commands]

requires:
  - phase: 01-foundation-hardening
    provides: ConfigValidationError and validateConfig for config validation
  - phase: 02-cli-hardening
    provides: CancellationError pattern from plan 02-01
provides:
  - Correct adminRoles inference for --defaults + --roles flag combination
  - Post-mutation config validation in add role and add provider commands
affects: [04-test-coverage]

tech-stack:
  added: []
  patterns: [post-mutation validateConfig backstop in add commands]

key-files:
  created: []
  modified:
    - src/commands/init.ts
    - src/commands/add.ts

key-decisions:
  - "adminRoles heuristic: owner + roles whose name contains 'admin' (matches askAdminAccess interactive behavior)"
  - "validateConfig serves as comprehensive backstop after manual fast-fail checks in add commands"
  - "ConfigValidationError caught and logged with logger.error + process.exit(1) for consistency"

patterns-established:
  - "Post-mutation validation pattern: always validateConfig before generateProject in add commands"

requirements-completed: [CLI-02, CLI-03, CLI-04, CFG-03]

duration: 4min
completed: 2026-03-01
---

# Plan 02-02: Defaults Flag Merging and Add Command Validation Summary

**Correct adminRoles inference for --defaults flag and post-mutation validateConfig backstop in add role/provider commands**

## Performance

- **Duration:** 4 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Improved buildAnswersFromFlags adminRoles heuristic to include roles whose name contains "admin"
- Added validateConfig calls to both addRoleCommand and addProviderCommand after config mutation
- Invalid additions are now rejected with clear error messages before file generation
- Existing test suite passes with all 22 tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and fix --defaults flag merging for adminRoles** - `51b2d0b` (feat)
2. **Task 2: Add post-mutation validateConfig to add commands** - `aa6496b` (feat)

## Files Created/Modified
- `src/commands/init.ts` - Updated adminRoles inference heuristic in buildAnswersFromFlags
- `src/commands/add.ts` - Added validateConfig + ConfigValidationError import and calls in both add commands

## Decisions Made
- adminRoles heuristic: owner + roles whose name contains "admin" (matches askAdminAccess interactive behavior)
- validateConfig serves as comprehensive backstop after manual fast-fail checks in add commands
- ConfigValidationError caught and logged with logger.error + process.exit(1) for consistency

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All CLI flag combinations now produce validated output
- Add commands validate before generation
- Phase 2 CLI hardening goals are met

---
*Plan: 02-02 (02-cli-hardening)*
*Completed: 2026-03-01*
