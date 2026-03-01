---
phase: 03-template-sql-correctness
plan: 01
subsystem: database
tags: [postgresql, sql, idempotency, handlebars, migrations, supabase]

requires:
  - phase: 01-foundation-hardening
    provides: Typed TemplateContext interface for template rendering
provides:
  - Idempotent SQL migration templates (all 5 .hbs files)
  - Safe re-run capability for all generated Supabase migrations
affects: [03-02, 04-test-coverage]

tech-stack:
  added: []
  patterns: [IF NOT EXISTS for CREATE TABLE/INDEX, DROP IF EXISTS before CREATE POLICY/TRIGGER, ON CONFLICT DO NOTHING for INSERT seed data]

key-files:
  created: []
  modified:
    - src/templates/schemas/001_roles_and_permissions.sql.hbs
    - src/templates/schemas/002_users_and_profiles.sql.hbs
    - src/templates/schemas/003_prompt_templates.sql.hbs
    - src/templates/schemas/004_llm_audit_log.sql.hbs
    - src/templates/schemas/005_billing.sql.hbs

key-decisions:
  - "CREATE OR REPLACE FUNCTION and ALTER TABLE ENABLE ROW LEVEL SECURITY left unchanged (already idempotent)"
  - "ON CONFLICT targets use UNIQUE constraint columns (name for roles, slug for plans, role_id+permission for role_permissions)"

patterns-established:
  - "Idempotency guard pattern: every DDL statement in SQL templates must have an idempotency guard"
  - "DROP before CREATE pattern: policies and triggers use DROP IF EXISTS + CREATE (PostgreSQL has no CREATE POLICY IF NOT EXISTS)"

requirements-completed: [TMPL-03]

duration: 8min
completed: 2026-03-01
---

# Plan 03-01: SQL Idempotency Guards Summary

**All 5 SQL migration templates now have idempotency guards on every DDL statement (CREATE TABLE/INDEX IF NOT EXISTS, DROP POLICY/TRIGGER IF EXISTS, INSERT ON CONFLICT DO NOTHING)**

## Performance

- **Duration:** 8 min
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added IF NOT EXISTS to all CREATE TABLE statements (7 total across 5 templates)
- Added DROP POLICY IF EXISTS before all CREATE POLICY statements (27 total)
- Added DROP TRIGGER IF EXISTS before all CREATE TRIGGER statements (5 total)
- Added IF NOT EXISTS to all CREATE INDEX statements (23 total)
- Added ON CONFLICT DO NOTHING to all INSERT seed data statements (roles, role_permissions, subscription_plans)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add idempotency guards to SQL templates 001-003** - `a4ed217` (feat)
2. **Task 2: Add idempotency guards to SQL templates 004-005** - `9a53acb` (feat)

## Files Created/Modified
- `src/templates/schemas/001_roles_and_permissions.sql.hbs` - IF NOT EXISTS on 2 tables, DROP IF EXISTS on 4 policies + 1 trigger, ON CONFLICT on 2 INSERT types
- `src/templates/schemas/002_users_and_profiles.sql.hbs` - IF NOT EXISTS on 1 table + 3 indexes, DROP IF EXISTS on 4 policies + 2 triggers
- `src/templates/schemas/003_prompt_templates.sql.hbs` - IF NOT EXISTS on 1 table + 3 indexes, DROP IF EXISTS on 3 policies + 1 trigger
- `src/templates/schemas/004_llm_audit_log.sql.hbs` - IF NOT EXISTS on 1 table + 5 indexes, DROP IF EXISTS on 4 policies
- `src/templates/schemas/005_billing.sql.hbs` - IF NOT EXISTS on 4 tables + 12 indexes, DROP IF EXISTS on 12 policies, ON CONFLICT on subscription_plans INSERT

## Decisions Made
- CREATE OR REPLACE FUNCTION left unchanged (already idempotent by nature)
- ALTER TABLE ENABLE ROW LEVEL SECURITY left unchanged (no-op if already enabled)
- CREATE OR REPLACE VIEW left unchanged (already idempotent)

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All SQL templates are idempotent, ready for validation harness (plan 03-02) to verify SQL syntax validity
- Existing test suite (test-generator.ts) passes all 4 configs with the guard changes

---
*Phase: 03-template-sql-correctness*
*Completed: 2026-03-01*
