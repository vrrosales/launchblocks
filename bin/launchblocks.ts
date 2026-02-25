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
  .action(initCommand);

program.parse();
