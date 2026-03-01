---
phase: 02-cli-hardening
plan: 01
subsystem: cli
tags: [error-handling, clack-prompts, graceful-shutdown]

requires:
  - phase: 01-foundation-hardening
    provides: ConfigValidationError pattern for error class design
provides:
  - CancellationError class for graceful shutdown across the CLI
  - CancellationError catch pattern in all command handlers
  - MCP setup cancellation skips service instead of aborting init
affects: [02-cli-hardening, 04-test-coverage]

tech-stack:
  added: []
  patterns: [CancellationError throw-catch for cancellation propagation]

key-files:
  created:
    - src/utils/errors.ts
  modified:
    - src/interview/questions/ai-tool.ts
    - src/interview/questions/signup.ts
    - src/interview/questions/roles.ts
    - src/interview/questions/permissions.ts
    - src/interview/questions/admin-access.ts
    - src/interview/questions/llm-access.ts
    - src/interview/questions/providers.ts
    - src/interview/questions/app-info.ts
    - src/interview/questions/billing.ts
    - src/setup/guide.ts
    - src/setup/runner.ts
    - src/commands/init.ts
    - src/commands/add.ts

key-decisions:
  - "CancellationError follows ConfigValidationError pattern (extends Error, sets this.name)"
  - "cancel() from @clack/prompts preserved before throw for display output"
  - "runSetup catches CancellationError per-service to skip rather than abort init"
  - "Top-level command handlers call process.exit(0) only in the CancellationError catch"

patterns-established:
  - "Cancellation pattern: cancel('message') then throw new CancellationError() in isCancel branches"
  - "Command handler catch pattern: CancellationError check before generic error handler"

requirements-completed: [CLI-01]

duration: 5min
completed: 2026-03-01
---

# Plan 02-01: Graceful Shutdown Summary

**CancellationError throw-catch pattern replaces all process.exit(0) calls for testable, hook-friendly cancellation propagation**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Created CancellationError class in src/utils/errors.ts
- Replaced all 18 process.exit(0) sites across 9 question files and setup/guide.ts with throw new CancellationError()
- Wired CancellationError catch into initCommand, addRoleCommand, addProviderCommand, and runSetup
- MCP setup cancellation now skips the service gracefully instead of aborting the entire init flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CancellationError and replace all process.exit(0)** - `ea9db19` (feat)
2. **Task 2: Wire CancellationError catch into command handlers and runSetup** - `fdf776e` (feat)

## Files Created/Modified
- `src/utils/errors.ts` - CancellationError class for graceful shutdown
- `src/interview/questions/*.ts` - 9 files: process.exit(0) replaced with throw new CancellationError()
- `src/setup/guide.ts` - 3 process.exit(0) sites replaced with throw new CancellationError()
- `src/setup/runner.ts` - CancellationError catch in runSetup skips service
- `src/commands/init.ts` - CancellationError catch in initCommand, isCancel throw conversion
- `src/commands/add.ts` - CancellationError catch in addRoleCommand and addProviderCommand, isCancel throw conversion

## Decisions Made
- CancellationError follows ConfigValidationError pattern (extends Error, sets this.name)
- cancel() from @clack/prompts preserved before throw for display output
- runSetup catches CancellationError per-service to skip rather than abort init
- Top-level command handlers call process.exit(0) only in the CancellationError catch

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CancellationError pattern is established for all CLI paths
- Plan 02-02 can proceed with add command validation knowing cancellation is handled

---
*Plan: 02-01 (02-cli-hardening)*
*Completed: 2026-03-01*
