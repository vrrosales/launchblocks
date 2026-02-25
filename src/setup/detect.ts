import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import type { McpServerStatus } from "./types.js";
import type { AiTool } from "../interview/types.js";

interface McpConfig {
  mcpServers?: Record<string, unknown>;
}

function readJsonSafe(filePath: string): McpConfig | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as McpConfig;
  } catch {
    return null;
  }
}

function checkServer(
  name: "supabase" | "vercel",
  projectConfig: McpConfig | null,
  userConfig: McpConfig | null
): McpServerStatus {
  if (projectConfig?.mcpServers?.[name]) {
    return { name, installed: true, location: "project" };
  }
  if (userConfig?.mcpServers?.[name]) {
    return { name, installed: true, location: "user" };
  }
  return { name, installed: false, location: null };
}

export function detectMcpServers(aiTool: AiTool): {
  supabase: McpServerStatus;
  vercel: McpServerStatus;
} {
  const projectPath =
    aiTool === "cursor"
      ? path.join(process.cwd(), ".cursor", "mcp.json")
      : path.join(process.cwd(), ".mcp.json");
  const userConfig =
    aiTool === "cursor" ? null : readJsonSafe(path.join(os.homedir(), ".claude.json"));

  const projectConfig = readJsonSafe(projectPath);

  return {
    supabase: checkServer("supabase", projectConfig, userConfig),
    vercel: checkServer("vercel", projectConfig, userConfig),
  };
}
