---
phase: 02-cli-hardening
status: passed
verified: 2026-03-01
verifier: automated
score: 5/5
---

# Phase 2: CLI Hardening Verification

## Goal
Every CLI command and flag combination produces correct output and handles cancellation gracefully instead of hard-exiting.

## Must-Have Verification

### Criterion 1: Graceful cancellation (CLI-01)
**Status: PASSED**

- Zero `process.exit(0)` calls remain in interview question files or `setup/guide.ts`
- 18 `throw new CancellationError()` sites across 9 question files and `setup/guide.ts`
- 4 `instanceof CancellationError` catches in command handlers (initCommand, addRoleCommand, addProviderCommand, runSetup)
- `runSetup` catches CancellationError per-service and skips instead of aborting init
- CancellationError class created in `src/utils/errors.ts`

**Evidence:**
```
grep -rn "process.exit(0)" src/interview/questions/ src/setup/guide.ts → 0 results
grep -rn "throw new CancellationError" src/interview/questions/ src/setup/guide.ts → 18 results
grep -rn "instanceof CancellationError" src/commands/ src/setup/runner.ts → 4 results
```

### Criterion 2: --defaults + --roles flag merging (CLI-02)
**Status: PASSED**

- `buildAnswersFromFlags` infers `adminRoles` as `[ownerRole, ...roleNames.filter(r => r !== ownerRole && r.includes("admin"))]`
- This matches the interactive `askAdminAccess` heuristic behavior
- `--defaults --roles "admin,user,moderator"` produces `adminRoles: ["admin"]` (owner "admin" is already included)
- `llmAccessRoles` defaults to all role names when `--llm-access` is not set

**Evidence:**
```
Line 95 of src/commands/init.ts: partial.adminRoles = [ownerRole, ...roleNames.filter(r => r !== ownerRole && r.includes("admin"))];
```

### Criterion 3: add role scoped regeneration (CLI-03)
**Status: PASSED**

- `addRoleCommand` uses `REGEN_SCOPE = ["config", "context", "specs", "sql"]` for scoped regeneration
- New role is pushed to `config.roles`, added to `llm_access_roles`, and optionally handles `--owner` and `--default` flags
- `validateConfig(config)` called after mutation and before `generateProject` to ensure consistency
- Build succeeds with no TypeScript errors

### Criterion 4: add provider scoped regeneration (CLI-04)
**Status: PASSED**

- `addProviderCommand` uses the same `REGEN_SCOPE` for scoped regeneration
- Provider is pushed to `config.llm_providers` and validated before generation
- Duplicate provider check rejects already-configured providers before mutation
- Build succeeds with no TypeScript errors

### Criterion 5: Post-mutation config validation (CFG-03)
**Status: PASSED**

- `addRoleCommand` calls `validateConfig(config)` after all mutations and before `generateProject`
- `addProviderCommand` calls `validateConfig(config)` after mutation and before `generateProject`
- `ConfigValidationError` is caught, logged with `logger.error`, and exits with code 1
- Existing manual fast-fail checks (duplicate role, duplicate provider, invalid provider name) remain as guards

**Evidence:**
```
grep -n "validateConfig(config)" src/commands/add.ts
→ Line 131: validateConfig(config);  (addRoleCommand)
→ Line 205: validateConfig(config);  (addProviderCommand)
```

## Requirements Traceability

| Requirement | Plan | Status | Evidence |
|-------------|------|--------|----------|
| CLI-01 | 02-01 | Complete | 0 process.exit(0), 18 CancellationError throws, 4 catch handlers |
| CLI-02 | 02-02 | Complete | adminRoles heuristic includes admin-named roles |
| CLI-03 | 02-02 | Complete | REGEN_SCOPE used, validateConfig backstop added |
| CLI-04 | 02-02 | Complete | REGEN_SCOPE used, validateConfig backstop added |
| CFG-03 | 02-02 | Complete | 2 validateConfig calls in add.ts |

## Build Verification

```
npm run build → 3 build targets all succeed (ESM library, ESM CLI, DTS)
npx tsx test/test-generator.ts → 22 passed, 0 failed
```

## Score: 5/5 must-haves verified

---
*Verified: 2026-03-01*
