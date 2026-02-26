/**
 * Programmatic test — runs the generator with default config
 * to verify all templates render and files are created correctly.
 *
 * Usage: npx tsx test/test-generator.ts
 */
import path from "node:path";
import fs from "fs-extra";
import { buildConfig, type LaunchblocksConfig } from "../src/generator/config-writer.js";
import { generateProject } from "../src/generator/index.js";
import { DEFAULT_ROLES, type InterviewAnswers } from "../src/interview/types.js";

const TEST_DIR = path.join(import.meta.dirname, "..", "tmp-test");

async function runTest(label: string, answers: InterviewAnswers) {
  const outputDir = path.join(TEST_DIR, label);
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);

  console.log(`\n=== Test: ${label} ===`);
  const config = buildConfig(answers);
  const files = await generateProject(outputDir, config);

  console.log(`  Created ${files.length} files:`);
  for (const f of files) {
    console.log(`    ${f}`);
  }

  // Verify all expected files exist
  const launchblocksDir = path.join(outputDir, "launchblocks");
  const checks = [
    "launchblocks.config.yaml",
    "LaunchBlocks_implementation.md",
    "specs/01-project-setup.md",
    "specs/02-database.md",
    "specs/03-authentication.md",
    "specs/04-user-management.md",
    "specs/05-llm-gateway.md",
    "specs/06-prompt-management.md",
    "specs/07-llm-audit.md",
    "schemas/migrations/001_roles_and_permissions.sql",
    "schemas/migrations/002_users_and_profiles.sql",
    "schemas/migrations/003_prompt_templates.sql",
    "schemas/migrations/004_llm_audit_log.sql",
    "schemas/sample-env.md",
    "references/supabase-auth-patterns.md",
    "references/vercel-deploy-checklist.md",
    "references/llm-pricing-table.md",
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const fullPath = path.join(launchblocksDir, check);
    if (await fs.pathExists(fullPath)) {
      const content = await fs.readFile(fullPath, "utf-8");
      if (content.length === 0) {
        console.log(`  FAIL: ${check} — file is empty`);
        failed++;
      } else if (content.includes("{{") && !check.endsWith(".yaml")) {
        // Check for unresolved Handlebars markers (but allow literal {{ in prompt docs)
        const lines = content.split("\n");
        const unresolvedLines = lines.filter(
          (l) => l.includes("{{") && !l.includes("\\{{") && !l.includes("`{{")
            && !l.includes("'{{") && !l.includes('"{{')
        );
        if (unresolvedLines.length > 0) {
          console.log(`  WARN: ${check} — possible unresolved template markers (${unresolvedLines.length} lines)`);
        }
        passed++;
      } else {
        passed++;
      }
    } else {
      console.log(`  FAIL: ${check} — file not found`);
      failed++;
    }
  }

  // Check for tool context files
  if (answers.aiTool === "claude" || answers.aiTool === "all") {
    const claudePath = path.join(launchblocksDir, "CLAUDE.md");
    if (await fs.pathExists(claudePath)) passed++;
    else { console.log("  FAIL: CLAUDE.md not found"); failed++; }
  }

  // Verify SQL contains correct role names
  const sqlContent = await fs.readFile(
    path.join(launchblocksDir, "schemas/migrations/001_roles_and_permissions.sql"),
    "utf-8"
  );
  for (const role of answers.roles) {
    if (sqlContent.includes(`'${role.name}'`)) {
      passed++;
    } else {
      console.log(`  FAIL: SQL missing role '${role.name}'`);
      failed++;
    }
  }

  // Verify LaunchBlocks_implementation.md has no [CONFIGURED: ...] markers
  const aiContext = await fs.readFile(
    path.join(launchblocksDir, "LaunchBlocks_implementation.md"),
    "utf-8"
  );
  if (aiContext.includes("[CONFIGURED:")) {
    console.log("  FAIL: LaunchBlocks_implementation.md contains unresolved [CONFIGURED:] markers");
    failed++;
  } else {
    passed++;
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function main() {
  // Test 1: Default config
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
  };

  const test1 = await runTest("defaults", defaultAnswers);

  // Test 2: Custom config
  const customAnswers: InterviewAnswers = {
    appName: "Acme AI Platform",
    roles: [
      {
        name: "owner",
        display_name: "Owner",
        is_owner_role: true,
        is_default_role: false,
        permissions: [
          "manage_users", "manage_roles", "manage_prompts",
          "view_audit_log", "export_audit_log", "manage_settings", "manage_providers",
        ],
      },
      {
        name: "editor",
        display_name: "Editor",
        is_owner_role: false,
        is_default_role: false,
        permissions: ["manage_prompts", "view_audit_log"],
      },
      {
        name: "viewer",
        display_name: "Viewer",
        is_owner_role: false,
        is_default_role: true,
        permissions: [],
      },
    ],
    ownerRole: "owner",
    defaultRole: "viewer",
    requireApproval: false,
    adminRoles: ["owner", "editor"],
    llmAccessRoles: ["owner", "editor"],
    llmProviders: ["openai", "anthropic", "mistral"],
    aiTool: "all",
  };

  const test2 = await runTest("custom", customAnswers);

  // Test 3: All providers
  const allProvidersAnswers: InterviewAnswers = {
    appName: "All Providers App",
    roles: DEFAULT_ROLES,
    ownerRole: "super_admin",
    defaultRole: "user",
    requireApproval: false,
    adminRoles: ["super_admin", "admin"],
    llmAccessRoles: ["super_admin", "admin", "user"],
    llmProviders: ["openai", "anthropic", "google", "mistral", "cohere", "xai", "deepseek", "groq"],
    aiTool: "claude",
  };

  const test3 = await runTest("all-providers", allProvidersAnswers);

  // Extra verification for test 3
  let test3Extra = true;
  const allProvDir = path.join(TEST_DIR, "all-providers", "launchblocks");

  // Verify sample-env.md contains all provider env vars
  const sampleEnv = await fs.readFile(path.join(allProvDir, "schemas/sample-env.md"), "utf-8");
  const expectedEnvVars = [
    "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_AI_API_KEY",
    "MISTRAL_API_KEY", "CO_API_KEY", "XAI_API_KEY",
    "DEEPSEEK_API_KEY", "GROQ_API_KEY", "LLM_SERVICE_URL",
  ];
  for (const envVar of expectedEnvVars) {
    if (!sampleEnv.includes(envVar)) {
      console.log(`  FAIL: sample-env.md missing ${envVar}`);
      test3Extra = false;
    }
  }

  // Verify LaunchBlocks_implementation.md contains Celeste and Python references
  const implMd = await fs.readFile(path.join(allProvDir, "LaunchBlocks_implementation.md"), "utf-8");
  for (const keyword of ["Celeste", "Python", "FastAPI", "services/llm/"]) {
    if (!implMd.includes(keyword)) {
      console.log(`  FAIL: LaunchBlocks_implementation.md missing "${keyword}"`);
      test3Extra = false;
    }
  }

  if (test3Extra) {
    console.log("  Extra checks: all passed");
  }

  // Cleanup
  // await fs.remove(TEST_DIR);

  console.log("\n============================");
  if (test1 && test2 && test3 && test3Extra) {
    console.log("ALL TESTS PASSED");
    process.exit(0);
  } else {
    console.log("SOME TESTS FAILED");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
