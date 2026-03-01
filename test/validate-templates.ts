/**
 * Template Validation Harness
 *
 * Validates three things across a representative config matrix:
 * (A) Template variable completeness (TMPL-01) -- no empty-string artifacts
 * (B) SQL syntax validity (TMPL-02) -- every SQL statement parses with libpg-query
 * (C) Conditional branch coverage (TMPL-04) -- all configs produce valid output
 *
 * Usage: npx tsx test/validate-templates.ts
 */
import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { parse } from "libpg-query";
import { buildConfig } from "../src/generator/config-writer.js";
import {
  buildTemplateContext,
  registerHelpers,
  getTemplatesDir,
} from "../src/generator/template-utils.js";
import {
  DEFAULT_ROLES,
  ALL_PERMISSIONS,
  type InterviewAnswers,
  type RoleConfig,
} from "../src/interview/types.js";

// ============================================================
// Section 1: Dollar-quote-aware SQL splitter
// ============================================================

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;
  let dollarTag = "";
  let i = 0;

  while (i < sql.length) {
    // Check for dollar-quote start/end
    if (sql[i] === "$") {
      // Try to match a dollar-quote tag: $tag$ or $$
      let j = i + 1;
      while (j < sql.length && sql[j] !== "$" && /[a-zA-Z0-9_]/.test(sql[j])) {
        j++;
      }
      if (j < sql.length && sql[j] === "$") {
        const tag = sql.substring(i, j + 1);
        if (inDollarQuote && tag === dollarTag) {
          // End of dollar-quoted block
          current += tag;
          i = j + 1;
          inDollarQuote = false;
          dollarTag = "";
          continue;
        } else if (!inDollarQuote) {
          // Start of dollar-quoted block
          inDollarQuote = true;
          dollarTag = tag;
          current += tag;
          i = j + 1;
          continue;
        }
      }
    }

    // Split on semicolons only when NOT inside a dollar-quote
    if (sql[i] === ";" && !inDollarQuote) {
      current += ";";
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  // Handle any remaining content without a trailing semicolon
  const remaining = current.trim();
  if (remaining.length > 0 && !remaining.startsWith("--")) {
    statements.push(remaining);
  }

  return statements;
}

// ============================================================
// Section 2: Empty-string artifact checker
// ============================================================

function checkForEmptyValues(rendered: string, filename: string): string[] {
  const issues: string[] = [];
  const lines = rendered.split("\n");

  if (filename.endsWith(".sql")) {
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      // Detect empty string in value position: = ''
      // But skip legitimate uses like DEFAULT '' (which is intentional in some cases)
      if (/=\s*''/.test(line) && !line.includes("DEFAULT ''") && !line.includes("COALESCE")) {
        // Check if this looks like a role or status value being empty
        if (/role\s*=\s*''|status\s*=\s*''|name\s*=\s*''/.test(line)) {
          issues.push(`${filename}:${lineNum + 1}: Suspicious empty string in value position: ${line.trim()}`);
        }
      }
      // Detect consecutive commas with only whitespace in VALUES
      if (/VALUES\s*\(/.test(line) || /,\s*,/.test(line)) {
        if (/,\s*,/.test(line)) {
          issues.push(`${filename}:${lineNum + 1}: Empty value in VALUES clause: ${line.trim()}`);
        }
      }
    }
  } else if (filename.endsWith(".md")) {
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      // Detect empty backtick pairs `` (but not triple backticks for code blocks)
      if (/(?<!`)`{2}(?!`)/.test(line) && !line.trim().startsWith("```")) {
        // Could be a false positive for markdown-in-markdown. Check carefully.
        // Skip lines that are just backtick fences
        if (!/^```/.test(line.trim())) {
          issues.push(`${filename}:${lineNum + 1}: Empty backtick pair: ${line.trim().substring(0, 100)}`);
        }
      }
      // Detect empty bold markers: ** **
      if (/\*\*\s*\*\*/.test(line)) {
        issues.push(`${filename}:${lineNum + 1}: Empty bold marker: ${line.trim().substring(0, 100)}`);
      }
      // Detect empty parentheses in value context: "Billing: Stripe ()"
      if (/:\s+\w+\s+\(\s*\)/.test(line)) {
        issues.push(`${filename}:${lineNum + 1}: Empty parentheses in value context: ${line.trim().substring(0, 100)}`);
      }
    }
  }

  return issues;
}

// ============================================================
// Section 3: SQL validation with libpg-query
// ============================================================

async function validateSql(sql: string, filename: string): Promise<string[]> {
  const errors: string[] = [];
  const statements = splitSqlStatements(sql);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    // Skip comment-only statements
    const nonCommentLines = stmt
      .split("\n")
      .filter((l) => !l.trim().startsWith("--") && l.trim().length > 0);
    if (nonCommentLines.length === 0) continue;

    try {
      await parse(stmt);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const preview = stmt.substring(0, 100).replace(/\n/g, " ");
      errors.push(
        `${filename} statement #${i + 1}: ${errMsg}\n  → ${preview}...`
      );
    }
  }

  return errors;
}

// ============================================================
// Section 4: Representative config matrix
// ============================================================

const CONFIGS: { label: string; answers: InterviewAnswers }[] = [
  {
    label: "default-no-billing",
    answers: {
      appName: "Default App",
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
      requireApproval: true,
      adminRoles: ["super_admin", "admin"],
      llmAccessRoles: ["super_admin", "admin", "user"],
      llmProviders: ["openai"],
      aiTool: "claude",
      includeBilling: false,
    },
  },
  {
    label: "no-approval-minimal",
    answers: {
      appName: "Minimal App",
      roles: [
        {
          name: "owner",
          display_name: "Owner",
          is_owner_role: true,
          is_default_role: false,
          permissions: [...ALL_PERMISSIONS],
        },
        {
          name: "member",
          display_name: "Member",
          is_owner_role: false,
          is_default_role: true,
          permissions: [],
        },
      ] as RoleConfig[],
      ownerRole: "owner",
      defaultRole: "member",
      requireApproval: false,
      adminRoles: ["owner"],
      llmAccessRoles: ["owner", "member"],
      llmProviders: ["anthropic"],
      aiTool: "cursor",
      includeBilling: false,
    },
  },
  {
    label: "billing-subscription",
    answers: {
      appName: "Subscription App",
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
      requireApproval: true,
      adminRoles: ["super_admin", "admin"],
      llmAccessRoles: ["super_admin", "admin", "user"],
      llmProviders: ["openai", "anthropic"],
      aiTool: "claude",
      includeBilling: true,
      billingModel: "subscription",
    },
  },
  {
    label: "billing-usage",
    answers: {
      appName: "Usage App",
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
      requireApproval: false,
      adminRoles: ["super_admin", "admin"],
      llmAccessRoles: ["super_admin", "admin", "user"],
      llmProviders: ["openai"],
      aiTool: "claude",
      includeBilling: true,
      billingModel: "usage",
    },
  },
  {
    label: "billing-both",
    answers: {
      appName: "Both Billing App",
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
      requireApproval: true,
      adminRoles: ["super_admin", "admin"],
      llmAccessRoles: ["super_admin", "admin", "user"],
      llmProviders: ["openai", "anthropic"],
      aiTool: "claude",
      includeBilling: true,
      billingModel: "both",
    },
  },
  {
    label: "all-providers",
    answers: {
      appName: "All Providers App",
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
      requireApproval: false,
      adminRoles: ["super_admin", "admin"],
      llmAccessRoles: ["super_admin", "admin", "user"],
      llmProviders: [
        "openai",
        "anthropic",
        "google",
        "mistral",
        "cohere",
        "xai",
        "deepseek",
        "groq",
      ],
      aiTool: "all",
      includeBilling: false,
    },
  },
];

// ============================================================
// Section 5: Template file definitions
// ============================================================

const BASE_SQL_TEMPLATES = [
  "schemas/001_roles_and_permissions.sql.hbs",
  "schemas/002_users_and_profiles.sql.hbs",
  "schemas/003_prompt_templates.sql.hbs",
  "schemas/004_llm_audit_log.sql.hbs",
];

const BILLING_SQL_TEMPLATE = "schemas/005_billing.sql.hbs";

const SAMPLE_ENV_TEMPLATE = "schemas/sample-env.md.hbs";

const BASE_SPEC_TEMPLATES = [
  "specs/01-project-setup.md.hbs",
  "specs/02-database.md.hbs",
  "specs/03-authentication.md.hbs",
  "specs/04-user-management.md.hbs",
  "specs/05-llm-gateway.md.hbs",
  "specs/06-prompt-management.md.hbs",
  "specs/07-llm-audit.md.hbs",
];

const BILLING_SPEC_TEMPLATE = "specs/08-billing.md.hbs";

const CONTEXT_TEMPLATE = "ai-context.md.hbs";

interface ToolFile {
  template: string;
  toolId: string;
}

const TOOL_FILES: ToolFile[] = [
  { template: "claude-md.md.hbs", toolId: "claude" },
  { template: "cursorrules.md.hbs", toolId: "cursor" },
  { template: "agents-md.md.hbs", toolId: "codex" },
  { template: "gemini-md.md.hbs", toolId: "gemini" },
];

// ============================================================
// Section 6: Main validation loop
// ============================================================

async function main() {
  // Register custom Handlebars helpers (match production behavior)
  registerHelpers();

  // Warm up libpg-query WASM
  await parse("SELECT 1");

  const templatesDir = getTemplatesDir();

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalSqlStatements = 0;
  let totalTemplatesRendered = 0;

  for (const { label, answers } of CONFIGS) {
    console.log(`\n=== Config: ${label} ===`);
    let configErrors = 0;
    let configWarnings = 0;

    const config = buildConfig(answers);
    const context = buildTemplateContext(config);

    // --- SQL Templates ---
    const sqlTemplates = [...BASE_SQL_TEMPLATES];
    if (config.include_billing) {
      sqlTemplates.push(BILLING_SQL_TEMPLATE);
    }

    for (const templateRelPath of sqlTemplates) {
      const templatePath = path.join(templatesDir, templateRelPath);
      const source = await fs.readFile(templatePath, "utf-8");
      const compiled = Handlebars.compile(source, { noEscape: true });
      const rendered = compiled(context);
      totalTemplatesRendered++;

      const outputName = templateRelPath
        .replace("schemas/", "")
        .replace(".hbs", "");

      // Validate SQL syntax
      const sqlErrors = await validateSql(rendered, outputName);
      const stmtCount = splitSqlStatements(rendered).filter((s) => {
        const nonComment = s
          .split("\n")
          .filter((l) => !l.trim().startsWith("--") && l.trim().length > 0);
        return nonComment.length > 0;
      }).length;
      totalSqlStatements += stmtCount;

      if (sqlErrors.length > 0) {
        for (const err of sqlErrors) {
          console.log(`  ERROR: ${err}`);
        }
        configErrors += sqlErrors.length;
      } else {
        console.log(`  OK: ${outputName} (${stmtCount} statements parsed)`);
      }

      // Check for empty-string artifacts
      const emptyIssues = checkForEmptyValues(rendered, outputName);
      if (emptyIssues.length > 0) {
        for (const issue of emptyIssues) {
          console.log(`  WARN: ${issue}`);
        }
        configWarnings += emptyIssues.length;
      }
    }

    // --- Sample Env ---
    {
      const templatePath = path.join(templatesDir, SAMPLE_ENV_TEMPLATE);
      const source = await fs.readFile(templatePath, "utf-8");
      const compiled = Handlebars.compile(source, { noEscape: true });
      const rendered = compiled(context);
      totalTemplatesRendered++;

      const emptyIssues = checkForEmptyValues(rendered, "sample-env.md");
      if (emptyIssues.length > 0) {
        for (const issue of emptyIssues) {
          console.log(`  WARN: ${issue}`);
        }
        configWarnings += emptyIssues.length;
      } else {
        console.log(`  OK: sample-env.md`);
      }
    }

    // --- Spec Templates ---
    const specTemplates = [...BASE_SPEC_TEMPLATES];
    if (config.include_billing) {
      specTemplates.push(BILLING_SPEC_TEMPLATE);
    }

    for (const templateRelPath of specTemplates) {
      const templatePath = path.join(templatesDir, templateRelPath);
      const source = await fs.readFile(templatePath, "utf-8");
      const compiled = Handlebars.compile(source, { noEscape: true });
      const rendered = compiled(context);
      totalTemplatesRendered++;

      const outputName = templateRelPath
        .replace("specs/", "")
        .replace(".hbs", "");

      // Check for empty-string artifacts (no SQL validation for spec files)
      const emptyIssues = checkForEmptyValues(rendered, outputName);
      if (emptyIssues.length > 0) {
        for (const issue of emptyIssues) {
          console.log(`  WARN: ${issue}`);
        }
        configWarnings += emptyIssues.length;
      } else {
        console.log(`  OK: ${outputName}`);
      }
    }

    // --- Context / Tool Templates ---
    // Always render ai-context.md.hbs
    {
      const templatePath = path.join(templatesDir, CONTEXT_TEMPLATE);
      const source = await fs.readFile(templatePath, "utf-8");
      const compiled = Handlebars.compile(source, { noEscape: true });
      const rendered = compiled(context);
      totalTemplatesRendered++;

      const emptyIssues = checkForEmptyValues(
        rendered,
        "LaunchBlocks_implementation.md"
      );
      if (emptyIssues.length > 0) {
        for (const issue of emptyIssues) {
          console.log(`  WARN: ${issue}`);
        }
        configWarnings += emptyIssues.length;
      } else {
        console.log(`  OK: LaunchBlocks_implementation.md`);
      }
    }

    // Render tool-specific context files based on ai_tool selection
    const selectedTools =
      config.ai_tool === "all"
        ? TOOL_FILES
        : TOOL_FILES.filter((t) => t.toolId === config.ai_tool);

    for (const tool of selectedTools) {
      const templatePath = path.join(templatesDir, tool.template);
      const source = await fs.readFile(templatePath, "utf-8");
      const compiled = Handlebars.compile(source, { noEscape: true });
      const rendered = compiled(context);
      totalTemplatesRendered++;

      const emptyIssues = checkForEmptyValues(
        rendered,
        tool.template.replace(".hbs", "")
      );
      if (emptyIssues.length > 0) {
        for (const issue of emptyIssues) {
          console.log(`  WARN: ${issue}`);
        }
        configWarnings += emptyIssues.length;
      } else {
        console.log(`  OK: ${tool.template.replace(".hbs", "")}`);
      }
    }

    totalErrors += configErrors;
    totalWarnings += configWarnings;

    if (configErrors === 0 && configWarnings === 0) {
      console.log(`  --- All templates valid for "${label}" ---`);
    } else {
      console.log(
        `  --- "${label}": ${configErrors} errors, ${configWarnings} warnings ---`
      );
    }
  }

  // ============================================================
  // Section 7: Summary report
  // ============================================================

  console.log("\n============================");
  console.log(
    `${CONFIGS.length} configs validated, ${totalTemplatesRendered} templates rendered, ${totalSqlStatements} SQL statements parsed`
  );
  console.log(`Errors: ${totalErrors}, Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log("\nVALIDATION FAILED");
    process.exit(1);
  } else {
    console.log("\nALL TEMPLATES VALID");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
