# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- PascalCase for command modules: `init.ts`, `add.ts`
- kebab-case for utility and domain files: `config-reader.ts`, `config-writer.ts`, `template-utils.ts`
- camelCase for function utility files: `logger.ts`, `validation.ts`, `spinner.ts`, `slug.ts`, `exec.ts`
- Use descriptive names matching domain: `spec-renderer.ts`, `sql-renderer.ts`, `context-renderer.ts`

**Functions:**
- camelCase for all functions: `startPhase()`, `succeedPhase()`, `buildConfig()`, `validateRoles()`
- Async functions use `async` keyword explicitly: `export async function generateProject()`
- Getter/query functions use descriptive names: `buildTemplateContext()`, `getTemplatesDir()`, `readConfig()`
- Assertion functions use `assert` prefix: `assertString()`, `assertBoolean()`, `assertStringArray()` in `src/generator/config-reader.ts`

**Variables:**
- camelCase for all variables and constants: `activeSpinner`, `outputDir`, `shouldRun`, `totalSteps`
- UPPERCASE_SNAKE_CASE for module-level constants: `VALID_AI_TOOLS`, `VALID_PROVIDERS`, `DEFAULT_ROLES`, `ALL_PERMISSIONS`
- Record constants use PascalCase keys: `PERMISSION_LABELS`, `FILE_DESCRIPTIONS`
- Use descriptive names: `prefilled`, `effectiveTarget`, `rolePermissionSummary`

**Types:**
- PascalCase for all types and interfaces: `InterviewAnswers`, `LaunchblocksConfig`, `RoleConfig`, `TreeNode`
- Suffix `Options` for function option objects: `AddRoleOptions`, `AddProviderOptions`, `CLIOptions`, `GenerateOptions`
- Suffix `Result` for function return types when complex: `SetupResult`
- Use discriminated union types: `type AiTool = "claude" | "cursor" | "codex" | "gemini" | "all"`

## Code Style

**Formatting:**
- No linting or formatter configuration detected (no `.eslintrc`, `.prettierrc`, or equivalent)
- File follows consistent 2-space indentation throughout codebase
- Maximum line length appears to be around 120 characters (observed in tsup config: `lineWidth: 120`)
- Triple-quoted comments for file-level documentation (e.g., `test/test-generator.ts`)

**Linting:**
- No ESLint or Prettier configuration found
- Comments include `// eslint-disable-next-line` in one place (`src/utils/logger.ts` line 193), but no config file

## Import Organization

**Order:**
1. Node.js built-in modules: `import path from "node:path"`, `import fs from "fs-extra"`
2. Third-party packages: `import chalk from "chalk"`, `import Handlebars from "handlebars"`
3. Local imports with explicit `.js` extensions: `import { buildConfig } from "../src/generator/config-writer.js"`

**Path Aliases:**
- No path aliases configured in `tsconfig.json`
- Uses relative imports with explicit `.js` extensions for ES modules
- Consistent use of file extensions in import statements (all end with `.js`)

**Module Re-exports:**
- Barrel export pattern used: `src/index.ts` exports only `{ initCommand }`
- Individual files export specific named exports

## Error Handling

**Patterns:**
- Async/await with try-catch for async operations (see `src/generator/index.ts` lines 51-59)
- Explicit error types with descriptive messages: `throw new Error("Config error: ...")`
- Type assertion functions for validation: `assertString()`, `assertBoolean()`, `assertStringArray()`
- Early return pattern with validation before main logic (see `src/commands/init.ts` lines 37-100)
- Process exit codes: `process.exit(0)` for success, `process.exit(1)` for failure
- Error logging via `logger.error()` before exit
- Promise rejection handling in exec wrapper (see `src/utils/exec.ts` lines 5-10)

**Error Recovery:**
- Spinner functions check for null before calling: `if (activeSpinner) { ... }`
- Cancelled prompts use `isCancel()` check and call `cancel()` for cleanup
- Dry-run mode uses temporary directory to avoid failures affecting real output

## Logging

**Framework:** Custom `logger` object with fixed methods

**Patterns:**
- Methods: `logger.step()`, `logger.success()`, `logger.info()`, `logger.warn()`, `logger.error()`, `logger.phase()`, `logger.statusLine()`, `logger.link()`, `logger.fileCreated()`, `logger.dryRunSummary()`, `logger.summary()`
- All logging goes through `console.log()` with chalk for colors
- Icons for status: `✓` for success, `✗` for failure, `→` for steps, `◆` for phases, `✅` for success method, `⚠` for warnings, `✖` for errors
- Indentation: All messages indented with 2 spaces or more (format: `  ${message}`)
- Color scheme: cyan for steps, green for success, yellow for warnings, red for errors, gray for info
- Special format for annotated trees with nested prefixes: `├──`, `└──`, `│`

## Comments

**When to Comment:**
- File-level documentation with `/**` style comments at top of file (see `test/test-generator.ts` lines 1-6)
- Complex logic: Explain why, not what (see `src/generator/template-utils.ts` lines 10-16)
- TODO/FIXME: None found in codebase (codebase is clean)
- Commented code sections: None found

**JSDoc/TSDoc:**
- Minimal usage observed
- Type assertions include brief descriptions: line breaks and hints in error messages instead
- Function signatures are self-documenting with full type information

## Function Design

**Size:**
- Most functions 20-80 lines
- Largest functions: `logger.summary()` (50 lines), `renderTree()` (25 lines), `buildTemplateContext()` (100+ lines)
- Preference for focused, single-responsibility functions

**Parameters:**
- Use typed parameter objects instead of multiple parameters (e.g., `options?: GenerateOptions` in `src/generator/index.ts`)
- Optional parameters using `?:` notation
- Avoid spreading - use explicit object patterns
- Destructuring in function bodies preferred (see `src/generator/index.ts` lines 31-35)

**Return Values:**
- Explicit return types on all functions: `Promise<string>`, `Promise<boolean>`, `void`
- Async functions return Promises with specific types
- Functions return early on validation failures
- Complex returns use interfaces: `DryRunFile`, `LaunchblocksConfig`, `TreeNode`

## Module Design

**Exports:**
- Named exports preferred: `export function`, `export interface`, `export const`
- Default exports used only for CLI entry point
- One main export per file where possible
- Re-export used for barrel files

**Barrel Files:**
- Minimal barrel exports: `src/index.ts` only exports initCommand
- Most modules import directly from their source files

## TypeScript

**Configuration:**
- Strict mode enabled: `"strict": true`
- ES2022 target with ESNext modules
- Source maps enabled: `"sourceMap": true`
- Declaration files generated for library: `"declaration": true`
- `esModuleInterop` enabled for third-party imports

**Type Safety:**
- Full type annotations on function parameters and return types
- Use of discriminated unions for type safety (e.g., `AiTool` type)
- Generic types used appropriately (e.g., `Record<string, unknown>`, `TreeNode[]`)
- Type assertions with guard checks: `const obj = raw as Record<string, unknown>`

## API Design

**CLI Commands:**
- Commander.js for command structure
- Options use kebab-case: `--app-name`, `--llm-providers`, `--ai-tool`
- Boolean flags: `--dry-run`, `--defaults`, `--require-approval`, `--no-require-approval`
- Subcommands nested under parent: `add role`, `add provider`
- Required positional arguments: `role <name>`, `provider <name>`
- All command handlers are async functions

**Configuration Format:**
- YAML for project configuration: `launchblocks.config.yaml`
- snake_case keys in YAML output (e.g., `app_name`, `owner_role`, `require_approval`)
- Separate concerns: interview answers use camelCase, config uses snake_case

---

*Convention analysis: 2026-03-01*
