# Codebase Concerns

**Analysis Date:** 2026-03-01

## Tech Debt

**Type Safety via `as` Casts:**
- Issue: Multiple unsafe type assertions throughout the codebase using `as string`, `as any`, and `as unknown as LaunchblocksConfig`
- Files: `src/generator/config-reader.ts` (lines 79, 86, 93, 110, 118, 159, 169), `src/setup/detect.ts` (line 15), `src/interview/runner.ts` (lines 119, 120), `src/commands/init.ts` (lines 165, 260), `src/commands/add.ts` (lines 85, 142, 202)
- Impact: Type assertions bypass TypeScript's safety net. While validation occurs at runtime, the pattern creates maintenance burden and makes it harder to catch errors during development
- Fix approach: Use proper type guards and discriminated unions instead of assertions. Create reusable assertion helpers that both guard types and document intent

**Large Logger Utility Module:**
- Issue: `src/utils/logger.ts` contains 304 lines with mixed concerns: formatting, tree building, rendering, summary generation
- Files: `src/utils/logger.ts`
- Impact: Difficult to test in isolation; changes to one output format risk breaking others; not easily reusable
- Fix approach: Split into focused modules: tree formatting (buildTree, renderTree), formatting utils (formatSize, mcpLabel), and output methods. Create a composable logger

**Incomplete Variable Assignment Tracking:**
- Issue: In `src/interview/runner.ts` lines 119-120, `ownerRole` and `defaultRole` are cast as strings but their derivation from prefilled state (lines 57-62) uses optional chaining with defaults, creating assertion mismatch
- Files: `src/interview/runner.ts`
- Impact: While the defaults prevent actual undefined values, the type assertion creates false confidence that may hide future logic errors
- Fix approach: Make the type guards explicit by creating typed wrapper functions that handle the optional→required conversion

**Unused "any" Comments:**
- Issue: Grep found comments marking regions for "any" handling but no actual TODOs or FIXMEs, indicating debt was noted but not tracked
- Files: Various files have comments like "Build partial answers from any individual flags" (src/commands/init.ts:231) but this is informal
- Impact: No systematic way to track and prioritize technical debt items
- Fix approach: Establish convention for marking debt: use `// TECH-DEBT: [description]` with consistent capitalization and reference issue numbers

## Known Bugs

**Generator Scope Filtering Not Comprehensive:**
- Issue: `src/generator/index.ts` lines 35-39 define a `shouldRun` function that filters by scope, but scope filtering is only partially implemented. Reference files copying (line 77-80) and SQL migration (likely) may not respect scope
- Files: `src/generator/index.ts` (lines 35, 49-60, 63-74, 77-80)
- Impact: When using `--scope` to regenerate specific files (e.g., in `add.ts` line 134), reference and migration files may be unnecessarily regenerated or skipped inconsistently
- Trigger: Run `launchblocks add role test-role --dry-run` and check what's included
- Workaround: Currently unclear if this causes actual issues; needs testing

**Process Exit Without Cleanup:**
- Issue: Multiple interview question files directly call `process.exit(0)` when user cancels, without attempting cleanup or returning control
- Files: `src/interview/questions/app-info.ts` (line 17), `src/interview/questions/admin-access.ts` (lines 41, 57), `src/interview/questions/permissions.ts` (line 30), `src/interview/questions/providers.ts` (line 21), `src/interview/questions/roles.ts` (lines 30, 52), `src/setup/guide.ts` (lines 45, 60, 101)
- Impact: No opportunity for cleanup, flush streams, or proper exit code communication; makes testing difficult; inconsistent with best practices for CLI apps
- Trigger: User presses Ctrl+C during interview
- Workaround: Could be handled by throwing a CancellationError instead and catching at top level

**JSON.parse Without Schema Validation:**
- Issue: `src/setup/detect.ts` (line 15) and `src/setup/install.ts` (line 20) parse JSON config files with `as McpConfig` cast without validating structure
- Files: `src/setup/detect.ts`, `src/setup/install.ts`
- Impact: If .mcp.json or .claude.json is malformed, the cast silently treats it as valid; optional chaining prevents crashes but creates silent failures
- Trigger: User has corrupted .mcp.json file
- Workaround: Files are treated as optional and read failures are caught, so damage is limited

## Security Considerations

**No Input Sanitization for File Paths:**
- Risk: Generated slug from app name (`src/generator/config-writer.ts` lines 28-32) uses regex to sanitize, but other user inputs directly used in path joins without validation
- Files: `src/generator/config-writer.ts`, `src/commands/init.ts` (app name validation at line 50-53)
- Current mitigation: App name length check (1-100 chars), slug regex filter, role name regex check (lowercase, letters, numbers, underscores)
- Recommendations: Validate all path inputs against whitelist of safe characters; document which inputs are safe for filesystem operations

**Env Variable Handling Missing:**
- Risk: CLI tools typically load environment-specific config and API keys, but no env var loading detected
- Files: None found
- Current mitigation: Not applicable to this CLI tool (doesn't call external APIs)
- Recommendations: Document that users must configure API credentials outside this tool; if future versions add external API calls, implement .env loading with clear secret warnings

**Secrets in Generated Context Files:**
- Risk: Generated specification and context files may include template examples that accidentally show secret patterns
- Files: Templates in `src/templates/specs/` (not fully reviewed)
- Current mitigation: Templates are generated by author, not user input
- Recommendations: Review templates for hardcoded API keys, secret examples; document that generated context should not be committed if it contains sensitive examples

## Performance Bottlenecks

**Synchronous File I/O in readJsonSafe:**
- Problem: `src/setup/detect.ts` (lines 11-18) uses `fs.existsSync()` followed by synchronous `fs.readFileSync()`
- Files: `src/setup/detect.ts` (lines 13-14)
- Cause: Easier to code, but blocks event loop during file reads
- Improvement path: Use async `fs.promises.readFile()` and update `detectMcpServers()` to be async; or keep sync pattern but only for small config files as acceptable trade-off

**Full Template Recompilation on Each Generate:**
- Problem: `src/generator/spec-renderer.ts` (lines 33-42) recompiles Handlebars templates every generation even if unchanged
- Files: `src/generator/spec-renderer.ts`, `src/generator/context-renderer.ts`
- Cause: No template caching layer
- Improvement path: Cache compiled templates in memory keyed by template path; clear cache only when templates directory changes

**Tree Rendering String Concatenation:**
- Problem: `src/utils/logger.ts` (lines 130-159) builds output array line-by-line with recursive function and multiple string concatenations
- Files: `src/utils/logger.ts` (renderTree function)
- Cause: No performance issue at scale, but pattern is inefficient for large tree structures
- Improvement path: Use single string builder; not critical for current use case but worth noting as this is called on success output

## Fragile Areas

**Interview State Derivation Logic:**
- Files: `src/interview/runner.ts` (lines 56-63)
- Why fragile: When roles are prefilled via flags, owner/default roles are derived using optional chaining and defaults (`roles[0].name`, `roles[roles.length - 1].name`). If role array is empty or modified, derivation breaks silently
- Safe modification: Add explicit null checks and throw early if roles array is missing or empty; add unit tests for all prefill combinations
- Test coverage: Interview tests exist in `test/test-generator.ts` but only test the happy path with full answers

**Config Validation Chain:**
- Files: `src/generator/config-reader.ts` (lines 56-170)
- Why fragile: Each validation assertion is independent; if one field's validation fails, others aren't checked, so errors are reported one at a time requiring multiple fix iterations
- Safe modification: Collect all errors during validation and report them together; make assertions return error objects instead of throwing
- Test coverage: No unit tests for validation; relies on integration tests

**Role and Permission Consistency Enforcement:**
- Files: `src/commands/add.ts` (lines 23-154), `src/interview/runner.ts`, `src/generator/config-reader.ts`
- Why fragile: Multiple places enforce the rule that roles must have valid permissions and that role names must exist in lists. No single source of truth
- Safe modification: Create a `RoleValidator` class that all three files use; centralize role-related rules
- Test coverage: Gaps in error cases for invalid role additions

**Template Directory Path Resolution:**
- Files: `src/generator/template-utils.ts` (lines 6-7, 17)
- Why fragile: Uses `import.meta.url` and `fileURLToPath` to resolve `__dirname`, then constructs template path. Changes to build output structure break this
- Safe modification: Use explicit relative path imports or configure template path in build config; document template path assumptions
- Test coverage: Test suite uses actual templates (test/test-generator.ts), so path issues would be caught

## Scaling Limits

**Single Directory Process.cwd() Assumption:**
- Current capacity: Works for single CLI invocation; assumes working directory is project root
- Limit: Programmatic API usage would require passing explicit paths; cannot run CLI in parallel for same project
- Scaling path: Extract pure generation functions into separate module; create API that doesn't depend on process.cwd()

**Config File Validation Without Schema Definition:**
- Current capacity: 7-8 required fields + optional billing fields
- Limit: Adding new config fields requires manual assertion additions in validateConfig(); easy to miss
- Scaling path: Use JSON Schema or TypeScript "satisfies" pattern with exhaustiveness checking to ensure all fields are validated

**No Version Migration Path:**
- Current capacity: Works for current config structure only
- Limit: If config schema changes in future versions, old configs will fail to load
- Scaling path: Add config version field; implement migration functions that transform old schema to new schema

## Dependencies at Risk

**Handlebars No Escape Mode:**
- Risk: `src/generator/spec-renderer.ts` (line 36) uses `{ noEscape: true }` to allow raw markdown/SQL output, but this disables XSS protection
- Impact: If any template or context data includes user input, injection is possible
- Migration plan: Audit all template usage; consider using safer template engine for specs (e.g., Template Literal or dedicated markdown helper); document that context values must be trusted

**chalk Color Library Minor Version:**
- Risk: `package.json` pins `chalk ^5.3.0` (major 5); breaking changes in minor/patch releases unlikely but possible
- Impact: Color output could break; not critical but affects CLI UX
- Migration plan: Keep current version; consider moving to a more stable color library if updating frequently

**ora Spinner State Management:**
- Risk: `src/utils/spinner.ts` uses module-level `activeSpinner` global; concurrent operations not supported
- Impact: If two spinners start simultaneously, state is lost
- Migration plan: Use context/stack-based spinner management; not needed for current sequential operation

## Missing Critical Features

**No Dry-Run for Config Updates:**
- Problem: `launchblocks add role` and `launchblocks add provider` regenerate files, but dry-run doesn't show what config will look like
- Blocks: Users can't preview role/provider changes before writing them

**No Interactive Config Editor:**
- Problem: Modifying launchblocks.config.yaml requires manual YAML editing
- Blocks: Users with complex configurations are forced to edit YAML or re-run init

**No Validation Before Generation:**
- Problem: Config is loaded and used, but only parsed errors are caught; logical validation (e.g., owner role has no permissions) is implicit
- Blocks: Invalid configs may generate files that look correct but don't work at runtime

## Test Coverage Gaps

**Config Validation Edge Cases:**
- What's not tested: Empty roles array, roles with duplicate names, permissions array with duplicates, invalid characters in provider names
- Files: `src/generator/config-reader.ts`
- Risk: Invalid configs slip through; generated files may fail at runtime
- Priority: High

**Interview Prefill Combinations:**
- What's not tested: All combinations of flag + env var + interview interactions; partial prefill with missing required fields
- Files: `src/interview/runner.ts`, `src/commands/init.ts` (lines 231-242)
- Risk: Edge cases cause silent failures or unexpected behavior
- Priority: High

**Error Recovery Paths:**
- What's not tested: File write failures, disk full, permission denied, YAML parse errors, malformed templates
- Files: `src/generator/index.ts`
- Risk: Partial file generation, orphaned output directories, misleading error messages
- Priority: Medium

**MCP Server Detection:**
- What's not tested: Missing .mcp.json files, empty config objects, corrupted JSON
- Files: `src/setup/detect.ts`, `src/setup/install.ts`
- Risk: Silent failures in MCP setup phase
- Priority: Medium

**CLI Command Argument Validation:**
- What's not tested: Invalid flag combinations, mutually exclusive flags, missing required arguments
- Files: `src/commands/init.ts`, `src/commands/add.ts`
- Risk: Cryptic error messages for user mistakes
- Priority: Low

---

*Concerns audit: 2026-03-01*
