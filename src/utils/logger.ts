import chalk from "chalk";
import { outro, note } from "@clack/prompts";
import type { SetupResult } from "../setup/types.js";
import type { AiTool } from "../interview/types.js";
import type { DryRunFile } from "../generator/index.js";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function mcpLabel(result: SetupResult, name: "supabase" | "vercel"): string {
  const status = result[name];
  if (!status.installed) return "not configured";
  return status.location === "project" ? "project-level" : "user-level";
}

function nextSteps(aiTool: AiTool, includeBilling: boolean): string[] {
  const moduleCount = includeBilling ? 8 : 7;
  const moduleText = `all ${moduleCount} modules`;

  switch (aiTool) {
    case "claude":
      return [
        `1. ${chalk.bold("cd launchblocks")}`,
        `2. Open your project in ${chalk.cyan("Claude Code")}`,
        `3. Tell Claude:`,
        ``,
        `   ${chalk.cyan.bold(`"Read LaunchBlocks_implementation.md and implement ${moduleText}"`)}`,
      ];
    case "cursor":
      return [
        `1. ${chalk.bold("cd launchblocks")}`,
        `2. Open your project in ${chalk.cyan("Cursor")}`,
        `3. In Composer, tell it:`,
        ``,
        `   ${chalk.cyan.bold(`"Read LaunchBlocks_implementation.md and implement ${moduleText}"`)}`,
      ];
    case "codex":
      return [
        `1. ${chalk.bold("cd launchblocks")}`,
        `2. Run:`,
        ``,
        `   ${chalk.cyan.bold(`codex "Read LaunchBlocks_implementation.md and implement ${moduleText}"`)}`,
      ];
    case "gemini":
      return [
        `1. ${chalk.bold("cd launchblocks")}`,
        `2. Run:`,
        ``,
        `   ${chalk.cyan.bold(`gemini "Read LaunchBlocks_implementation.md and implement ${moduleText}"`)}`,
      ];
    case "all":
      return [
        `1. ${chalk.bold("cd launchblocks")}`,
        `2. Open your project in your preferred ${chalk.cyan("AI coding tool")}`,
        `3. Tell the AI:`,
        ``,
        `   ${chalk.cyan.bold(`"Read LaunchBlocks_implementation.md and implement ${moduleText}"`)}`,
      ];
  }
}

// Static map of file descriptions for the annotated tree
const FILE_DESCRIPTIONS: Record<string, string> = {
  "launchblocks.config.yaml": "Your project configuration",
  "LaunchBlocks_implementation.md": "Master specification (all 7 modules)",
  "CLAUDE.md": "AI context for Claude Code",
  ".cursorrules": "AI context for Cursor",
  "AGENTS.md": "AI context for Codex",
  "GEMINI.md": "AI context for Gemini",
  "specs/01-project-setup.md": "Framework scaffolding & env vars",
  "specs/02-database.md": "Schema design & RLS policies",
  "specs/03-authentication.md": "Signup, login, OAuth flows",
  "specs/04-user-management.md": "User CRUD & approval workflow",
  "specs/05-llm-gateway.md": "Python microservice & Celeste SDK",
  "specs/06-prompt-management.md": "Prompt template CRUD & versioning",
  "specs/07-llm-audit.md": "Audit log & cost tracking",
  "specs/08-billing.md": "Stripe billing & subscriptions",
  "schemas/migrations/001_roles_and_permissions.sql": "",
  "schemas/migrations/002_users_and_profiles.sql": "",
  "schemas/migrations/003_prompt_templates.sql": "",
  "schemas/migrations/004_llm_audit_log.sql": "",
  "schemas/migrations/005_billing.sql": "",
  "schemas/sample-env.md": "Environment variable reference",
  "references/supabase-auth-patterns.md": "Auth code examples",
  "references/vercel-deploy-checklist.md": "Deployment checklist",
  "references/llm-pricing-table.md": "LLM model pricing data",
};

interface TreeNode {
  name: string;
  description: string;
  children: TreeNode[];
}

function buildTree(files: string[]): TreeNode {
  const root: TreeNode = { name: "launchblocks/", description: "", children: [] };

  for (const file of files) {
    // Strip "launchblocks/" prefix
    const relative = file.replace(/^launchblocks\//, "");
    const parts = relative.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        const desc = FILE_DESCRIPTIONS[relative] ?? "";
        current.children.push({ name: part, description: desc, children: [] });
      } else {
        let dir = current.children.find(
          (c) => c.children.length > 0 && c.name === part + "/"
        );
        if (!dir) {
          dir = { name: part + "/", description: "", children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  return root;
}

function renderTree(node: TreeNode, prefix: string = ""): string[] {
  const lines: string[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const isLast = i === node.children.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    const name =
      child.children.length > 0
        ? chalk.bold(child.name)
        : chalk.white(child.name);

    const descPad = child.description
      ? " ".repeat(Math.max(1, 40 - (prefix + connector + child.name).length))
      : "";
    const desc = child.description
      ? chalk.dim(descPad + child.description)
      : "";

    lines.push(`${prefix}${connector}${name}${desc}`);

    if (child.children.length > 0) {
      lines.push(...renderTree(child, prefix + childPrefix));
    }
  }

  return lines;
}

function countByCategory(files: string[]): {
  specs: number;
  migrations: number;
  references: number;
  context: number;
} {
  let specs = 0;
  let migrations = 0;
  let references = 0;
  let context = 0;

  for (const f of files) {
    if (f.includes("/specs/")) specs++;
    else if (f.includes("/migrations/")) migrations++;
    else if (f.includes("/references/")) references++;
    else context++;
  }

  return { specs, migrations, references, context };
}

function summaryLine(files: string[]): string {
  const counts = countByCategory(files);
  const parts: string[] = [];
  if (counts.specs > 0) parts.push(`${counts.specs} specs`);
  if (counts.migrations > 0) parts.push(`${counts.migrations} migrations`);
  if (counts.references > 0) parts.push(`${counts.references} references`);
  if (counts.context > 0) parts.push(`${counts.context} context files`);
  return `Created ${files.length} files (${parts.join(", ")})`;
}

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, "");
}

export const logger = {

  step(label: string) {
    console.log(chalk.cyan(`\n  → ${label}\n`));
  },

  success(message: string) {
    console.log(chalk.green(`  ✅ ${message}`));
  },

  info(message: string) {
    console.log(chalk.gray(`  ${message}`));
  },

  warn(message: string) {
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  error(message: string) {
    console.log(chalk.red(`  ✖ ${message}`));
  },

  phase(label: string) {
    console.log(chalk.bold.cyan(`\n  ◆ ${label}\n`));
  },

  statusLine(label: string, ok: boolean, detail?: string) {
    const icon = ok ? chalk.green("✓") : chalk.red("✗");
    const text = detail ? `${label} — ${detail}` : label;
    console.log(`  ${icon} ${text}`);
  },

  link(url: string) {
    console.log(chalk.blue.underline(`    ${url}`));
  },

  fileCreated(filePath: string) {
    console.log(chalk.gray(`    ${filePath}`));
  },

  dryRunSummary(files: DryRunFile[]) {
    console.log();
    console.log(
      chalk.yellow("  ⚡ Dry run — no files were written.\n")
    );
    console.log(chalk.white("  Files that would be created:\n"));

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    for (const file of files) {
      const sizeStr = formatSize(file.size);
      console.log(
        chalk.gray(`    ${file.path}`) + chalk.dim(`  (${sizeStr})`)
      );
    }

    console.log();
    console.log(
      chalk.white(
        `  Total: ${files.length} files (${formatSize(totalSize)})`
      )
    );
    console.log();
    console.log(
      chalk.gray(
        "  Run without --dry-run to generate these files."
      )
    );
    console.log();
  },

  summary(files: string[], setupResult: SetupResult | null, aiTool: AiTool, includeBilling = false) {
    console.log();
    logger.success("Launchblocks initialized successfully!\n");

    // Annotated file tree
    const tree = buildTree(files);
    console.log(chalk.white("  " + chalk.bold(tree.name)));
    for (const line of renderTree(tree)) {
      console.log("  " + line);
    }

    // Summary metrics
    console.log();
    console.log(chalk.green(`  ${summaryLine(files)}`));

    // MCP Servers
    if (setupResult) {
      console.log();
      console.log(chalk.white("  MCP Servers:"));
      logger.statusLine(
        `Supabase (${mcpLabel(setupResult, "supabase")})`,
        setupResult.supabase.installed
      );
      logger.statusLine(
        `Vercel (${mcpLabel(setupResult, "vercel")})`,
        setupResult.vercel.installed
      );
    }

    // Next steps using @clack/prompts note()
    const steps = nextSteps(aiTool, includeBilling);
    const stepsContent = steps.map((s) => stripAnsi(s)).join("\n");
    note(stepsContent, "Next steps");

    outro("Project generated! See next steps above.");
  },
};
