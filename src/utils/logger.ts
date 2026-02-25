import chalk from "chalk";

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

  fileCreated(filePath: string) {
    console.log(chalk.gray(`    ${filePath}`));
  },

  summary(files: string[]) {
    console.log();
    logger.success("Launchblocks initialized successfully!\n");
    console.log(chalk.white("  Created:"));
    for (const file of files) {
      logger.fileCreated(file);
    }
    console.log();
    console.log(chalk.white("  Next steps:"));
    console.log(chalk.gray("    1. cd launchblocks"));
    console.log(chalk.gray('    2. Open your project in your AI coding tool'));
    console.log(
      chalk.gray(
        '    3. Tell it: "Read AI_CONTEXT.md and implement all 7 modules"'
      )
    );
    console.log(
      chalk.gray("       (pick whatever framework you prefer)")
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
