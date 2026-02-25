import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

const MCP_URLS: Record<string, string> = {
  supabase: "https://mcp.supabase.com/mcp",
  vercel: "https://mcp.vercel.com",
};

interface McpConfig {
  mcpServers?: Record<string, { type: string; url: string }>;
  [key: string]: unknown;
}

function readJsonSafe(filePath: string): McpConfig {
  try {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as McpConfig;
  } catch {
    return {};
  }
}

export async function installMcpServer(
  name: string,
  scope: "project" | "user"
): Promise<void> {
  const filePath =
    scope === "project"
      ? path.join(process.cwd(), ".mcp.json")
      : path.join(os.homedir(), ".claude.json");

  const config = readJsonSafe(filePath);

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers[name] = {
    type: "http",
    url: MCP_URLS[name],
  };

  await fs.outputFile(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function ensureGitignore(): Promise<boolean> {
  const gitignorePath = path.join(process.cwd(), ".gitignore");

  try {
    let content = "";
    if (fs.existsSync(gitignorePath)) {
      content = await fs.readFile(gitignorePath, "utf-8");
    }

    if (content.includes(".mcp.json")) {
      return false;
    }

    const newline = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
    await fs.outputFile(
      gitignorePath,
      content + newline + ".mcp.json\n",
      "utf-8"
    );
    return true;
  } catch {
    return false;
  }
}
