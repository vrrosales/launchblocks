---
phase: 01-foundation-hardening
plan: 01
subsystem: types
tags: [typescript, handlebars, validation, config, interfaces]

requires:
  - phase: none
    provides: leaf-level plan with no upstream dependencies
provides:
  - TemplateContext interface for typed template rendering pipeline
  - ConfigValidationError class for multi-error config validation
  - Error-accumulating validateConfig with cross-field consistency checks
  - Typed renderer signatures (TemplateContext instead of Record<string, unknown>)
affects: [01-02, phase-2, phase-3, phase-4]

tech-stack:
  added: []
  patterns: [error-accumulation, named-interface-return-types]

key-files:
  created: []
  modified:
    - src/generator/template-utils.ts
    - src/generator/config-reader.ts
    - src/generator/spec-renderer.ts
    - src/generator/sql-renderer.ts
    - src/generator/context-renderer.ts

key-decisions:
  - "TemplateContext interface mirrors exact return shape of buildTemplateContext -- no fields added or removed"
  - "ConfigValidationError stores errors array for programmatic access, formats numbered list in message"
  - "Cross-field validation only runs when roleNames has entries (avoids false positives when roles array itself is invalid)"
  - "Internal as casts in config-reader return builder are acceptable -- validated fields, will be addressed in Plan 02 if cleaner pattern emerges"

patterns-established:
  - "Error accumulation: collect all errors into string[], throw once with ConfigValidationError"
  - "Named interface return types: functions return named interfaces, not Record<string, unknown>"

requirements-completed: [TYPE-02, CFG-01, CFG-02]

duration: 8min
completed: 2026-03-01
---

# Plan 01-01: Foundation Hardening Summary

**Named TemplateContext interface replaces Record<string, unknown> across rendering pipeline; validateConfig accumulates all errors with cross-field role reference checks**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01
- **Completed:** 2026-03-01
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- TemplateContext interface with ProviderDisplay, RolePermissionSummary, and PermissionFlat sub-interfaces exported from template-utils.ts
- buildTemplateContext() returns TemplateContext instead of Record<string, unknown>
- All three renderers (spec, sql, context) accept TemplateContext parameter type
- ConfigValidationError class with errors array for programmatic access
- validateConfig collects all field-level and cross-field errors before throwing a single exception
- Cross-field validation: owner_role, default_role, admin_roles, llm_access_roles must reference valid role names

## Task Commits

Each task was committed atomically:

1. **Task 1: Define TemplateContext interface and type the context pipeline** - `0afa247` (feat)
2. **Task 2: Refactor validateConfig to accumulate all errors with cross-field validation** - `fc641c9` (feat)

## Files Created/Modified
- `src/generator/template-utils.ts` - Added TemplateContext, ProviderDisplay, RolePermissionSummary, PermissionFlat interfaces; typed buildTemplateContext return
- `src/generator/config-reader.ts` - Rewrote validateConfig with error accumulation and ConfigValidationError class
- `src/generator/spec-renderer.ts` - Changed context parameter to TemplateContext
- `src/generator/sql-renderer.ts` - Changed context parameter to TemplateContext
- `src/generator/context-renderer.ts` - Changed context parameter to TemplateContext

## Decisions Made
- Kept exact same error message strings where possible for backwards compatibility
- ConfigValidationError extends Error with public readonly errors array
- Internal `as` casts in config-reader return builder are acceptable (validated fields)

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TemplateContext interface ready for Plan 01-02 to build on
- Typed renderer signatures eliminate Record<string, unknown> that Plan 02 would need to cast through
- ConfigValidationError class available for test assertions in Phase 4

---
*Phase: 01-foundation-hardening*
*Completed: 2026-03-01*
