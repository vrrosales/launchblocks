import { confirm, select, isCancel, cancel, log } from "@clack/prompts";
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

  log.step(`${info.display} Setup`);

  const hasAccount = await confirm({
    message: `Do you have a ${info.display} account?`,
    initialValue: true,
  });

  if (isCancel(hasAccount)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (!hasAccount) {
    log.info("Create your free account:");
    logger.link(info.signupUrl);
    console.log();

    const created = await confirm({
      message: `Have you created your ${info.display} account?`,
      initialValue: true,
    });

    if (isCancel(created)) {
      cancel("Operation cancelled.");
      process.exit(0);
    }

    if (!created) {
      log.info(
        `Skipping ${info.display} setup. You can configure it later.`
      );
      return { installed: false, scope: null };
    }
  }

  log.info(
    `After setup, authenticate in ${toolName} when it connects to the ${info.display} MCP server.`
  );

  // Cursor only supports project-level MCP config
  if (aiTool === "cursor") {
    log.info(`Installing to .cursor/mcp.json`);
    await installMcpServer(name, "project", aiTool);
    await ensureGitignore(".cursor/mcp.json");

    log.success(`${info.display} MCP server configured in .cursor/mcp.json`);
    return { installed: true, scope: "project" };
  }

  const scope = await select({
    message: `Where should we install the ${info.display} MCP server?`,
    options: [
      {
        label: "Project level (.mcp.json in current directory)",
        value: "project" as const,
      },
      {
        label: "User level (~/.claude.json — available in all projects)",
        value: "user" as const,
      },
    ],
  });

  if (isCancel(scope)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  await installMcpServer(name, scope, aiTool);

  if (scope === "project") {
    await ensureGitignore();
  }

  log.success(`${info.display} MCP server configured in ${
    scope === "project" ? ".mcp.json" : "~/.claude.json"
  }`);

  return { installed: true, scope };
}
