import inquirer from "inquirer";
import { logger } from "../utils/logger.js";
import { installMcpServer, ensureGitignore } from "./install.js";
import type { AiTool } from "../interview/types.js";

const SERVICE_INFO: Record<
  string,
  { display: string; signupUrl: string }
> = {
  supabase: {
    display: "Supabase",
    signupUrl: "https://supabase.com/dashboard/sign-up",
  },
  vercel: {
    display: "Vercel",
    signupUrl: "https://vercel.com/signup",
  },
};

const TOOL_DISPLAY_NAME: Record<string, string> = {
  claude: "Claude Code",
  cursor: "Cursor",
  all: "Claude Code",
};

export async function guideService(
  name: "supabase" | "vercel",
  aiTool: AiTool
): Promise<{
  installed: boolean;
  scope: "project" | "user" | null;
}> {
  const info = SERVICE_INFO[name];
  const toolName = TOOL_DISPLAY_NAME[aiTool] ?? "Claude Code";

  logger.step(`${info.display} Setup`);

  const { hasAccount } = await inquirer.prompt([
    {
      type: "confirm",
      name: "hasAccount",
      message: `Do you have a ${info.display} account?`,
      default: true,
    },
  ]);

  if (!hasAccount) {
    console.log();
    logger.info("Create your free account:");
    logger.link(info.signupUrl);
    console.log();

    const { created } = await inquirer.prompt([
      {
        type: "confirm",
        name: "created",
        message: `Have you created your ${info.display} account?`,
        default: true,
      },
    ]);

    if (!created) {
      logger.info(
        `Skipping ${info.display} setup. You can configure it later.`
      );
      return { installed: false, scope: null };
    }
  }

  console.log();
  logger.info(
    `After setup, authenticate in ${toolName} when it connects to the ${info.display} MCP server.`
  );
  console.log();

  // Cursor only supports project-level MCP config
  if (aiTool === "cursor") {
    logger.info(`Installing to .cursor/mcp.json`);
    await installMcpServer(name, "project", aiTool);
    await ensureGitignore(".cursor/mcp.json");

    logger.success(`${info.display} MCP server configured in .cursor/mcp.json`);
    return { installed: true, scope: "project" };
  }

  const { scope } = await inquirer.prompt([
    {
      type: "list",
      name: "scope",
      message: `Where should we install the ${info.display} MCP server?`,
      choices: [
        {
          name: "Project level (.mcp.json in current directory)",
          value: "project",
        },
        {
          name: "User level (~/.claude.json — available in all projects)",
          value: "user",
        },
      ],
    },
  ]);

  await installMcpServer(name, scope, aiTool);

  if (scope === "project") {
    await ensureGitignore();
  }

  logger.success(`${info.display} MCP server configured in ${
    scope === "project" ? ".mcp.json" : "~/.claude.json"
  }`);

  return { installed: true, scope };
}
