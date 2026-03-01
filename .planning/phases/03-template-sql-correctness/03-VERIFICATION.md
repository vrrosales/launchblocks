---
phase: 03-template-sql-correctness
status: passed
verified: 2026-03-01
requirements: [TMPL-01, TMPL-02, TMPL-03, TMPL-04]
score: 4/4
---

# Phase 3: Template & SQL Correctness -- Verification Report

## Phase Goal

> Every generated spec and SQL migration is complete (no blank values from missing template variables), syntactically valid, and safe to re-run

## Requirement Verification

### TMPL-01: Template Variables Resolve to Non-Empty Values

**Status: PASSED**

The validation harness (`test/validate-templates.ts`) renders all 18 `.hbs` templates across 6 representative configurations and checks for empty-string artifacts. Zero empty-string artifacts detected across all 93 template renderings.

**Evidence:**
- `npx tsx test/validate-templates.ts` exits 0 with "Errors: 0, Warnings: 0"
- Empty-string detection checks: `= ''` in SQL, empty backtick pairs in Markdown, empty bold markers, empty parentheses in value context

### TMPL-02: Generated SQL is Syntactically Valid PostgreSQL

**Status: PASSED**

Every generated SQL statement parses correctly with libpg-query (real PostgreSQL C parser compiled to WASM). This covers all DDL types: CREATE TABLE, CREATE POLICY, CREATE FUNCTION (PL/pgSQL), CREATE TRIGGER, CREATE INDEX, CREATE VIEW, INSERT, ALTER TABLE, and DROP statements.

**Evidence:**
- 596 SQL statements parsed across 6 configs with zero parse errors
- libpg-query validates: CREATE POLICY (Supabase RLS), SECURITY DEFINER, GENERATED ALWAYS AS, dollar-quoted PL/pgSQL function bodies
- Dollar-quote-aware SQL splitter correctly handles PL/pgSQL semicolons inside function bodies

### TMPL-03: SQL Migrations Are Idempotent

**Status: PASSED**

All 5 SQL migration templates have idempotency guards on every DDL statement:

| Guard Type | Count | Templates |
|-----------|-------|-----------|
| CREATE TABLE IF NOT EXISTS | 9 | All 5 templates |
| DROP POLICY IF EXISTS + CREATE POLICY | 27 pairs | All 5 templates |
| DROP TRIGGER IF EXISTS + CREATE TRIGGER | 4 pairs | 001, 002, 003 |
| CREATE INDEX IF NOT EXISTS | 23 | 002, 003, 004, 005 |
| INSERT ON CONFLICT DO NOTHING | 3 | 001 (roles, role_permissions), 005 (subscription_plans) |
| CREATE OR REPLACE FUNCTION (already idempotent) | 5 | 001, 002, 005 |
| CREATE OR REPLACE VIEW (already idempotent) | 1 | 004 |

**Evidence:**
- Grep verification: zero bare `CREATE TABLE` without `IF NOT EXISTS`, zero bare `CREATE POLICY` without preceding `DROP POLICY IF EXISTS`
- `npm run build && npx tsx test/test-generator.ts` -- all 4 existing test configs pass

### TMPL-04: Conditional Branches Render Correctly

**Status: PASSED**

Six representative configurations cover all conditional dimensions:

| Config | Billing | Model | Approval | Providers | Roles | AI Tool |
|--------|---------|-------|----------|-----------|-------|---------|
| default-no-billing | off | -- | on | 1 (openai) | 3 (DEFAULT) | claude |
| no-approval-minimal | off | -- | off | 1 (anthropic) | 2 (custom) | cursor |
| billing-subscription | on | subscription | on | 2 | 3 (DEFAULT) | claude |
| billing-usage | on | usage | off | 1 | 3 (DEFAULT) | claude |
| billing-both | on | both | on | 2 | 3 (DEFAULT) | claude |
| all-providers | off | -- | off | 8 (all) | 3 (DEFAULT) | all |

**Evidence:**
- billing-subscription: 005_billing.sql renders 36 statements (no usage_records table)
- billing-usage: 005_billing.sql renders 46 statements (includes usage_records + indexes + policies)
- billing-both: 005_billing.sql renders 46 statements (same as usage, includes usage_records)
- default-no-billing: 005_billing.sql not rendered at all (correct -- billing disabled)
- all-providers: all 4 tool context files rendered (claude-md, cursorrules, agents-md, gemini-md)

## Overall Score

**4/4 must-haves verified**

All requirements passed. No gaps found.

## Artifacts Produced

| Artifact | Path | Purpose |
|----------|------|---------|
| SQL templates (5) | `src/templates/schemas/*.sql.hbs` | Idempotent migration templates |
| Validation harness | `test/validate-templates.ts` | Automated proof of TMPL-01, TMPL-02, TMPL-04 |
| libpg-query | `package.json` devDependency | Real PostgreSQL parser for SQL validation |

---
*Verified: 2026-03-01*
