import { Command } from "commander";
import { initCommand } from "../src/commands/init.js";
import { addRoleCommand, addProviderCommand } from "../src/commands/add.js";

const program = new Command();

program
  .name("launchblocks")
  .description("Spec-Driven Development (SDD) tool for AI-powered applications")
  .version("0.1.0");

program
  .command("init")
  .description(
    "Initialize a new Launchblocks project with interactive configuration"
  )
  .option("--defaults", "Use recommended defaults, skip interview")
  .option("--dry-run", "Preview output without writing files")
  .option("--config <path>", "Regenerate project from an existing config file")
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
  .option("--include-billing", "Include Stripe billing module")
  .option(
    "--billing-model <model>",
    "Billing model: subscription | usage | both"
  )
  .action(initCommand);

const add = program
  .command("add")
  .description("Add a role or provider to an existing Launchblocks project");

add
  .command("role <name>")
  .description("Add a new role to the project")
  .option("--permissions <list>", "Comma-separated permissions")
  .option("--owner", "Set as owner role")
  .option("--default", "Set as default role")
  .option("--dry-run", "Preview changes without writing files")
  .action(addRoleCommand);

add
  .command("provider <name>")
  .description("Add a new LLM provider")
  .option("--dry-run", "Preview changes without writing files")
  .action(addProviderCommand);

program.parse();
