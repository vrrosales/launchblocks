# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Runner:**
- No test framework configured (no jest, vitest, mocha, etc.)
- Tests are written as standalone Node.js scripts

**Test Files:**
- Single test file: `test/test-generator.ts`
- No `.test.ts` or `.spec.ts` files in codebase
- Test executable using `npx tsx test/test-generator.ts`

**Assertions:**
- Manual assertions using conditional logic and console logging
- No assertion library (no Jest matchers, Chai, etc.)
- Verification through file existence checks: `fs.pathExists()`, `fs.readFile()`
- Content validation by string matching: `content.includes()`, `content.length === 0`

**Run Commands:**
```bash
npx tsx test/test-generator.ts              # Run all tests
npm run build                               # Build before testing
npm run dev                                 # Watch mode for development
```

## Test File Organization

**Location:**
- Tests in separate `test/` directory
- Not co-located with source files

**Naming:**
- `test-generator.ts` - descriptive test name with `test-` prefix

**Structure:**
```
test/
├── test-generator.ts          # Main test runner
└── fixtures/                  # Test data directory (empty)
```

## Test Structure

**Suite Organization:**
```typescript
// test/test-generator.ts
async function runTest(label: string, answers: InterviewAnswers) {
  // Setup
  const outputDir = path.join(TEST_DIR, label);
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);

  // Action
  console.log(`\n=== Test: ${label} ===`);
  const config = buildConfig(answers);
  const files = await generateProject(outputDir, config);

  // Assertions
  let passed = 0;
  let failed = 0;
  for (const check of checks) {
    if (await fs.pathExists(fullPath)) {
      // Verify content
      passed++;
    } else {
      console.log(`  FAIL: ${check} — file not found`);
      failed++;
    }
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function main() {
  // Run multiple test cases
  const test1 = await runTest("defaults", defaultAnswers);
  const test2 = await runTest("custom", customAnswers);

  // Final result
  if (test1 && test2) {
    console.log("ALL TESTS PASSED");
    process.exit(0);
  } else {
    console.log("SOME TESTS FAILED");
    process.exit(1);
  }
}
```

**Patterns:**
- Setup: Create clean directory with `fs.remove()` and `fs.ensureDir()`
- Execution: Call function under test with predefined inputs
- Assertions: Check file existence and content validity
- Teardown: Optional cleanup (commented out in test with `// await fs.remove(TEST_DIR);`)
- Result collection: Counter variables for passed/failed checks

## Mocking

**Framework:**
- No mocking framework used
- Tests use real file system operations
- Tests use real template rendering (Handlebars)

**Approach:**
- Integration tests that exercise full workflows
- Temporary directories for isolation: `path.join(import.meta.dirname, "..", "tmp-test")`
- No stubbing or spying on functions

## Test Data and Fixtures

**Test Data:**
```typescript
// test/test-generator.ts
const defaultAnswers: InterviewAnswers = {
  appName: "My Test App",
  roles: DEFAULT_ROLES,
  ownerRole: "super_admin",
  defaultRole: "user",
  requireApproval: true,
  adminRoles: ["super_admin", "admin"],
  llmAccessRoles: ["super_admin", "admin", "user"],
  llmProviders: ["openai"],
  aiTool: "claude",
  includeBilling: false,
};

const customAnswers: InterviewAnswers = {
  appName: "Acme AI Platform",
  roles: [
    {
      name: "owner",
      display_name: "Owner",
      is_owner_role: true,
      is_default_role: false,
      permissions: [...],
    },
    // ...
  ],
};
```

**Location:**
- Test data defined inline in test file
- Constants imported from source: `DEFAULT_ROLES` from `src/interview/types.js`
- Fixtures directory exists but is empty

**Data Patterns:**
- Test cases use realistic data
- Multiple scenarios: defaults, custom roles, all providers, billing enabled
- Variations test different config combinations

## Coverage

**Requirements:**
- None enforced - no coverage tool configured

**What's Tested:**
- Generator output file creation and naming
- Template rendering completion
- SQL role seeding
- Configuration preservation
- Provider-specific environment variables
- Billing module additions
- Tool-specific context files

**What's NOT Tested:**
- CLI argument parsing
- Interview question flow
- User interaction
- Setup/MCP installation
- Error handling paths
- Individual utility functions
- Command execution

## Test Types

**Integration Tests:**
- Single comprehensive test file
- Tests the full generation pipeline with realistic inputs
- Verifies end-to-end workflows: init → config → generation
- Tests with multiple configuration combinations (4 main test scenarios)

**File-based Verification:**
- Checks file existence: `fs.pathExists(fullPath)`
- Validates file content length: `content.length === 0`
- Searches for specific strings: `content.includes("{{")`, `sqlContent.includes("'${role.name}'")`
- Checks for template marker resolution: detects unresolved `{{` and `[CONFIGURED:]` markers
- Verifies module count in documentation

**Scenario-based Tests:**
```typescript
// Test 1: Default configuration
await runTest("defaults", defaultAnswers);

// Test 2: Custom roles
await runTest("custom", customAnswers);

// Test 3: All LLM providers
await runTest("all-providers", allProvidersAnswers);

// Test 4: Billing enabled
await runTest("billing", billingAnswers);
```

## Test Validation Strategies

**Content Validation:**
```typescript
// File existence
if (await fs.pathExists(fullPath)) {
  const content = await fs.readFile(fullPath, "utf-8");
  // Check for empty files
  if (content.length === 0) {
    console.log(`  FAIL: ${check} — file is empty`);
  }
  // Check for unresolved templates
  if (content.includes("{{") && !check.endsWith(".yaml")) {
    const unresolvedLines = lines.filter(l => l.includes("{{"));
    if (unresolvedLines.length > 0) {
      console.log(`  WARN: ${check} — possible unresolved template markers`);
    }
  }
}
```

**Configuration Verification:**
```typescript
// Verify SQL contains custom role names
for (const role of answers.roles) {
  if (sqlContent.includes(`'${role.name}'`)) {
    passed++;
  } else {
    console.log(`  FAIL: SQL missing role '${role.name}'`);
    failed++;
  }
}

// Verify implementation doc doesn't have unconfigured markers
if (aiContext.includes("[CONFIGURED:")) {
  console.log("  FAIL: LaunchBlocks_implementation.md contains unresolved markers");
  failed++;
}
```

**Provider-specific Checks:**
```typescript
// Verify environment variables for all providers
const sampleEnv = await fs.readFile(path.join(...), "utf-8");
const expectedEnvVars = [
  "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_AI_API_KEY",
  // ...
];
for (const envVar of expectedEnvVars) {
  if (!sampleEnv.includes(envVar)) {
    console.log(`  FAIL: sample-env.md missing ${envVar}`);
  }
}
```

## Error Handling in Tests

**Error Patterns:**
```typescript
async function main() {
  try {
    // Run tests
    const test1 = await runTest("defaults", defaultAnswers);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
```

**Output Format:**
- `FAIL: <check> — <reason>` for test failures
- `WARN: <check> — <reason>` for warnings
- Results counter: `Results: N passed, N failed`
- Summary line: `ALL TESTS PASSED` or `SOME TESTS FAILED`

## Current Test Coverage

**Strengths:**
- End-to-end generation pipeline tested
- Multiple configuration scenarios covered
- File integrity checks (existence, empty files)
- Template rendering validation
- Provider configuration validation
- Configuration preservation

**Gaps:**
- No CLI command testing
- No error path testing (invalid inputs, missing files)
- No interactive prompt testing
- No unit tests for utility functions
- No mock/stub testing for file I/O
- No performance tests
- No validation of file permissions or formats beyond content

## Running Tests

**Setup:**
```bash
npm install                    # Install dependencies
npm run build                  # Build project
```

**Execute:**
```bash
npx tsx test/test-generator.ts # Run tests directly
```

**Output Interpretation:**
- Each test case prints: `=== Test: <name> ===`
- For each file check: either passes silently or prints `FAIL:` or `WARN:`
- Final summary: `Results: N passed, N failed`
- Overall result: `ALL TESTS PASSED` (exit 0) or `SOME TESTS FAILED` (exit 1)
- Test output is written to `/tmp-test/` directory for inspection

---

*Testing analysis: 2026-03-01*
