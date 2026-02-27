import { Command } from "commander";
import { initCommand } from "../src/commands/init.js";

const program = new Command();

program
  .name("launchblocks")
  .description("Spec-driven launchpad for AI-powered applications")
  .version("0.1.0");

program
  .command("init")
  .description(
    "Initialize a new Launchblocks project with interactive configuration"
  )
  .option("--defaults", "Use recommended defaults, skip interview")
  .option("--dry-run", "Preview output without writing files")
  .option("--app-name <name>", "Application name")
  .option(
    "--roles <roles>",
    "Comma-separated role names (first = owner, last = default)"
  )
  .option("--require-approval", "Require admin approval for signups")
  .option("--no-require-approval", "Don't require approval for signups")
  .option(
    "--llm-providers <list>",
    "Comma-separated providers (openai,anthropic,google,...)"
  )
  .option(
    "--llm-access <roles>",
    'Comma-separated roles with LLM access, or "all"'
  )
  .option(
    "--ai-tool <tool>",
    "AI tool: claude | cursor | codex | gemini | all"
  )
  .option("--skip-mcp", "Skip MCP server setup")
  .action(initCommand);

program.parse();
