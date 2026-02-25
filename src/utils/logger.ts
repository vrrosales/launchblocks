import chalk from "chalk";
import type { SetupResult } from "../setup/types.js";
import type { AiTool } from "../interview/types.js";

function mcpLabel(result: SetupResult, name: "supabase" | "vercel"): string {
  const status = result[name];
  if (!status.installed) return "not configured";
  return status.location === "project" ? "project-level" : "user-level";
}

function nextSteps(aiTool: AiTool): string[] {
  switch (aiTool) {
    case "claude":
      return [
        "1. Open your project in Claude Code",
        "2. When prompted, authenticate Supabase & Vercel via OAuth",
        '3. Tell Claude: "Read LaunchBlocks_implementation.md and implement all 7 modules"',
      ];
    case "cursor":
      return [
        "1. Open your project in Cursor",
        "2. When prompted, authenticate MCP servers",
        '3. In Composer, tell it: "Read LaunchBlocks_implementation.md and implement all 7 modules"',
      ];
    case "codex":
      return [
        "1. Navigate to your project directory",
        '2. Run: codex "Read LaunchBlocks_implementation.md and implement all 7 modules"',
      ];
    case "gemini":
      return [
        "1. Navigate to your project directory",
        '2. Run: gemini "Read LaunchBlocks_implementation.md and implement all 7 modules"',
      ];
    case "all":
      return [
        "1. Open your project in your preferred AI coding tool",
        "2. If using Claude Code or Cursor, authenticate MCP servers when prompted",
        '3. Tell the AI: "Read LaunchBlocks_implementation.md and implement all 7 modules"',
      ];
  }
}

export const logger = {
  banner() {
    console.log();
    console.log(
      chalk.cyan(
        "  ╔══════════════════════════════════════════════╗"
      )
    );
    console.log(
      chalk.cyan(
        "  ║                                              ║"
      )
    );
    console.log(
      chalk.cyan("  ║") +
        chalk.bold.white(
          "   Launchblocks — Spec-Driven AI App Foundation"
        ) +
        chalk.cyan("║")
    );
    console.log(
      chalk.cyan(
        "  ║                                              ║"
      )
    );
    console.log(
      chalk.cyan("  ║") +
        chalk.white(
          "   Let's configure your project.              "
        ) +
        chalk.cyan("║")
    );
    console.log(
      chalk.cyan(
        "  ║                                              ║"
      )
    );
    console.log(
      chalk.cyan(
        "  ╚══════════════════════════════════════════════╝"
      )
    );
    console.log();
  },

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

  summary(files: string[], setupResult: SetupResult | null, aiTool: AiTool) {
    console.log();
    logger.success("Launchblocks initialized successfully!\n");
    console.log(chalk.white("  Created:"));
    for (const file of files) {
      logger.fileCreated(file);
    }

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

    console.log();
    console.log(chalk.white("  Next steps:"));
    for (const step of nextSteps(aiTool)) {
      console.log(chalk.gray(`    ${step}`));
    }
    console.log();
    console.log(
      chalk.white("  The LaunchBlocks_implementation.md is your master blueprint.")
    );
    console.log(
      chalk.white(
        "  The SQL files in schemas/migrations/ are ready to run in Supabase."
      )
    );
    console.log();
  },
};
