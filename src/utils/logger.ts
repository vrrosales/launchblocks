import chalk from "chalk";
import type { SetupResult } from "../setup/types.js";

function mcpLabel(result: SetupResult, name: "supabase" | "vercel"): string {
  const status = result[name];
  if (!status.installed) return "not configured";
  return status.location === "project" ? "project-level" : "user-level";
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

  summary(files: string[], setupResult?: SetupResult) {
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
    console.log(chalk.gray("    1. Open your project in Claude Code"));
    console.log(
      chalk.gray(
        "    2. When prompted, authenticate Supabase & Vercel via OAuth"
      )
    );
    console.log(
      chalk.gray(
        '    3. Tell Claude: "Read AI_CONTEXT.md and implement all 7 modules"'
      )
    );
    console.log();
    console.log(
      chalk.white("  The AI_CONTEXT.md is your master blueprint.")
    );
    console.log(
      chalk.white(
        "  The SQL files in schemas/migrations/ are ready to run in Supabase."
      )
    );
    console.log();
  },
};
