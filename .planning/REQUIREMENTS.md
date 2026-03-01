# Requirements: LaunchBlocks CLI Quality Audit

**Defined:** 2026-03-01
**Core Value:** Generated specs must be complete, correct, and implementable by any AI coding tool regardless of stack.

## v1 Requirements

Requirements for this quality audit. Each maps to roadmap phases.

### Config Validation

- [x] **CFG-01**: Config validation collects and reports all errors at once instead of failing on the first error
- [x] **CFG-02**: Cross-field validation enforces consistency (owner role exists in roles list, admin roles are valid role names, LLM access roles are valid)
- [ ] **CFG-03**: `add role` and `add provider` commands re-validate the mutated config before passing to the generator

### Type Safety

- [x] **TYPE-01**: Unsafe `as` type casts replaced with proper type guards and discriminated unions across all source files
- [x] **TYPE-02**: `buildTemplateContext()` returns a typed interface (not `Record<string, unknown>`) so template variables are statically verifiable

### CLI Hardening

- [ ] **CLI-01**: All `process.exit(0)` calls in interview questions and setup guide replaced with CancellationError pattern for graceful shutdown
- [ ] **CLI-02**: `--defaults` flag combined with individual flags (`--roles`, `--providers`, etc.) produces correct merged results
- [ ] **CLI-03**: `add role` scoped regeneration produces correct output (config, context, specs, SQL all updated consistently)
- [ ] **CLI-04**: `add provider` scoped regeneration produces correct output

### Template & SQL Correctness

- [ ] **TMPL-01**: All Handlebars template variables resolve to non-empty values (no silent empty strings from missing context)
- [ ] **TMPL-02**: Generated SQL migrations are syntactically valid PostgreSQL
- [ ] **TMPL-03**: SQL migrations are idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS guards)
- [ ] **TMPL-04**: All conditional template branches render correctly (billing on/off, usage vs subscription billing model, different role counts, different provider combinations)

### Testing

- [ ] **TEST-01**: CLI integration tests run the built binary end-to-end and verify all expected output files are created with correct content
- [ ] **TEST-02**: Config validation tests cover edge cases (empty roles array, duplicate role names, invalid characters, missing required fields, invalid cross-references)
- [ ] **TEST-03**: Template snapshot / golden file tests capture expected output for representative configurations and detect regressions

## v2 Requirements

Deferred to future work. Tracked but not in current roadmap.

### Developer Experience

- **DX-01**: Zod schema replacing manual config validation assertions
- **DX-02**: Config file versioning with migration path for schema changes
- **DX-03**: Biome linter/formatter integration

### Advanced Testing

- **ATEST-01**: Cross-configuration matrix testing (all role/provider/billing combos)
- **ATEST-02**: SQL syntax validation via node-sql-parser in test suite
- **ATEST-03**: Node.js version bump to 20+ (18 EOL)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Branding rename (LaunchBlocks -> VibeKit) | LaunchBlocks IS the brand; folder name is irrelevant |
| New modules beyond existing 7+1 | This audit is about quality, not features |
| Stack-specific code generation | LaunchBlocks generates specs, not code |
| UI/web dashboard | CLI-only tool |
| Plugin/extension system | Premature for current stage |
| Test framework migration | Keep programmatic test pattern unless golden file testing strongly requires it |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CFG-01 | Phase 1: Foundation Hardening | Complete |
| CFG-02 | Phase 1: Foundation Hardening | Complete |
| CFG-03 | Phase 2: CLI Hardening | Pending |
| TYPE-01 | Phase 1: Foundation Hardening | Complete |
| TYPE-02 | Phase 1: Foundation Hardening | Complete |
| CLI-01 | Phase 2: CLI Hardening | Pending |
| CLI-02 | Phase 2: CLI Hardening | Pending |
| CLI-03 | Phase 2: CLI Hardening | Pending |
| CLI-04 | Phase 2: CLI Hardening | Pending |
| TMPL-01 | Phase 3: Template & SQL Correctness | Pending |
| TMPL-02 | Phase 3: Template & SQL Correctness | Pending |
| TMPL-03 | Phase 3: Template & SQL Correctness | Pending |
| TMPL-04 | Phase 3: Template & SQL Correctness | Pending |
| TEST-01 | Phase 4: Test Coverage | Pending |
| TEST-02 | Phase 4: Test Coverage | Pending |
| TEST-03 | Phase 4: Test Coverage | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
