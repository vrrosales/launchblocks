import { logger } from "../utils/logger.js";
import { detectMcpServers } from "./detect.js";
import { guideService } from "./guide.js";
import type { McpServerStatus, SetupResult } from "./types.js";

function locationLabel(status: McpServerStatus): string {
  if (!status.installed) return "not configured";
  return `found in ${status.location === "project" ? ".mcp.json" : "~/.claude.json"}`;
}

export async function runSetup(): Promise<SetupResult> {
  logger.phase("MCP Server Setup");

  logger.info("Checking for MCP servers...");
  const detected = detectMcpServers();

  logger.statusLine("Supabase MCP", detected.supabase.installed, locationLabel(detected.supabase));
  logger.statusLine("Vercel MCP", detected.vercel.installed, locationLabel(detected.vercel));

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
    const { installed, scope } = await guideService(name);
    if (installed && scope) {
      result[name] = { name, installed: true, location: scope };
      result.installed.push(name);
    } else {
      result.skipped.push(name);
    }
  }

  return result;
}
