import { logger } from "../utils/logger.js";
import { detectMcpServers } from "./detect.js";
import { guideService } from "./guide.js";
import type { McpServerStatus, SetupResult } from "./types.js";
import type { AiTool } from "../interview/types.js";

function locationLabel(status: McpServerStatus, aiTool: AiTool): string {
  if (!status.installed) return "not configured";
  if (aiTool === "cursor") {
    return "found in .cursor/mcp.json";
  }
  return `found in ${status.location === "project" ? ".mcp.json" : "~/.claude.json"}`;
}

export async function runSetup(aiTool: AiTool): Promise<SetupResult | null> {
  // No MCP support for codex or gemini
  if (aiTool === "codex" || aiTool === "gemini") {
    return null;
  }

  logger.phase("MCP Server Setup");

  logger.info("Checking for MCP servers...");
  const detected = detectMcpServers(aiTool);

  logger.statusLine("Supabase MCP", detected.supabase.installed, locationLabel(detected.supabase, aiTool));
  logger.statusLine("Vercel MCP", detected.vercel.installed, locationLabel(detected.vercel, aiTool));

  const result: SetupResult = {
    supabase: { ...detected.supabase },
    vercel: { ...detected.vercel },
    installed: [],
    skipped: [],
  };

  if (detected.supabase.installed && detected.vercel.installed) {
    console.log();
    logger.success("All MCP servers are already configured!");
    return result;
  }

  const services: ("supabase" | "vercel")[] = [];
  if (!detected.supabase.installed) services.push("supabase");
  if (!detected.vercel.installed) services.push("vercel");

  for (const name of services) {
    const { installed, scope } = await guideService(name, aiTool);
    if (installed && scope) {
      result[name] = { name, installed: true, location: scope };
      result.installed.push(name);
    } else {
      result.skipped.push(name);
    }
  }

  return result;
}
