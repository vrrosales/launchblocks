---
phase: 01-foundation-hardening
plan: 02
subsystem: types
tags: [typescript, function-overloads, type-guards, type-narrowing]

requires:
  - phase: 01-foundation-hardening/01
    provides: TemplateContext interface and typed renderer signatures
provides:
  - Zero unsafe as casts in source files (excluding as const and config-reader internals)
  - Function overloads on generateProject for exact return types
  - Type guard functions for AiTool and BillingModel validation
  - LaunchblocksConfig.ai_tool narrowed from string to AiTool
affects: [phase-2, phase-3, phase-4]

tech-stack:
  added: []
  patterns: [function-overloads, type-guards, nullish-coalescing-fallback]

key-files:
  created: []
  modified:
    - src/generator/index.ts
    - src/generator/config-writer.ts
    - src/generator/config-reader.ts
    - src/generator/template-utils.ts
    - src/commands/init.ts
    - src/commands/add.ts
    - src/interview/runner.ts
    - src/interview/questions/permissions.ts
    - src/interview/questions/roles.ts
    - src/interview/questions/billing.ts

key-decisions:
  - "Used function overloads on generateProject instead of discriminated union -- callers get exact types without casting"
  - "Type guard functions isAiTool/isBillingModel validate and narrow in one step"
  - "Replaced as BillingModel with as const in billing.ts select options -- semantically equivalent but uses legitimate narrowing"
  - "ownerRole/defaultRole use ?? fallback instead of as string -- adds runtime safety as defensive programming"
  - "permissions.ts cast removed entirely -- TypeScript narrows after isCancel + process.exit(never)"
  - "Cleaned up unused Permission type imports in init.ts, roles.ts, permissions.ts"

patterns-established:
  - "Function overloads: when return type depends on options, use overloads not union"
  - "Type guards: prefer isX(value): value is X over manual cast after validation"
  - "Nullish coalescing for optional narrowing: use ?? instead of as string"

requirements-completed: [TYPE-01]

duration: 10min
completed: 2026-03-01
---

# Plan 01-02: Eliminate Unsafe Type Casts Summary

**Zero unsafe as SomeType casts remain across source files -- function overloads, type guards, and narrowing replace all 16+ casts**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-01
- **Completed:** 2026-03-01
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- generateProject has function overloads: dryRun:true returns DryRunFile[], default returns string[]
- All 8 as DryRunFile[]/as string[] casts removed from init.ts and add.ts
- isAiTool/isBillingModel type guard functions replace as AiTool/as BillingModel casts
- LaunchblocksConfig.ai_tool narrowed from string to AiTool type
- runner.ts ownerRole/defaultRole use ?? fallback instead of as string
- permissions.ts Permission[] cast removed (TypeScript narrows after isCancel+exit)
- billing.ts as BillingModel replaced with as const (legitimate narrowing)
- roles.ts and init.ts [...ALL_PERMISSIONS] cast removed (spread preserves element types)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generateProject overloads and eliminate casts in init.ts and add.ts** - `1060bec` (feat)
2. **Task 2: Eliminate remaining as casts in interview runner and permissions** - `85094a5` (feat)

## Files Created/Modified
- `src/generator/index.ts` - Added function overloads for generateProject
- `src/generator/config-writer.ts` - Narrowed ai_tool from string to AiTool
- `src/generator/config-reader.ts` - Updated ai_tool cast to AiTool, added AiTool import
- `src/generator/template-utils.ts` - Updated TemplateContext.ai_tool to AiTool
- `src/commands/init.ts` - Removed all unsafe casts, added type guard functions
- `src/commands/add.ts` - Removed all DryRunFile[]/string[] casts and multiselect cast
- `src/interview/runner.ts` - Replaced as string with ?? fallback
- `src/interview/questions/permissions.ts` - Removed as Permission[] cast
- `src/interview/questions/roles.ts` - Removed as Permission[] spread cast
- `src/interview/questions/billing.ts` - Replaced as BillingModel with as const

## Decisions Made
- Used as const instead of as BillingModel in select options (semantically equivalent, uses legitimate narrowing)
- Cleaned up unused Permission type imports that were only needed for the removed casts

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Type system is now trustworthy -- strict:true compiles with zero unsafe casts
- Phase 2 (CLI Hardening) can rely on correct types flowing through the pipeline
- Phase 4 (Test Coverage) can assert on ConfigValidationError.errors array

---
*Phase: 01-foundation-hardening*
*Completed: 2026-03-01*
