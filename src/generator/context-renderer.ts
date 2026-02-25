import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import type { LaunchblocksConfig } from "./config-writer.js";
import { getTemplatesDir } from "./template-utils.js";

interface ToolFile {
  template: string;
  outputName: string;
  toolId: string;
}

const TOOL_FILES: ToolFile[] = [
  { template: "claude-md.md.hbs", outputName: "CLAUDE.md", toolId: "claude" },
  {
    template: "cursorrules.md.hbs",
    outputName: ".cursorrules",
    toolId: "cursor",
  },
  { template: "agents-md.md.hbs", outputName: "AGENTS.md", toolId: "codex" },
  { template: "gemini-md.md.hbs", outputName: "GEMINI.md", toolId: "gemini" },
];

export async function renderContextFiles(
  outputDir: string,
  config: LaunchblocksConfig,
  context: Record<string, unknown>
): Promise<string[]> {
  const templatesDir = getTemplatesDir();
  const created: string[] = [];

  // Render LaunchBlocks_implementation.md (always generated)
  const aiContextTemplatePath = path.join(templatesDir, "ai-context.md.hbs");
  const aiContextTemplate = await fs.readFile(aiContextTemplatePath, "utf-8");
  const aiContextCompiled = Handlebars.compile(aiContextTemplate, {
    noEscape: true,
  });
  const aiContextRendered = aiContextCompiled(context);
  await fs.outputFile(
    path.join(outputDir, "LaunchBlocks_implementation.md"),
    aiContextRendered,
    "utf-8"
  );
  created.push("launchblocks/LaunchBlocks_implementation.md");

  // Render tool-specific context files based on selection
  const selectedTools =
    config.ai_tool === "all"
      ? TOOL_FILES
      : TOOL_FILES.filter((t) => t.toolId === config.ai_tool);

  for (const tool of selectedTools) {
    const templatePath = path.join(templatesDir, tool.template);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent, { noEscape: true });
    const rendered = template(context);

    await fs.outputFile(
      path.join(outputDir, tool.outputName),
      rendered,
      "utf-8"
    );
    created.push(`launchblocks/${tool.outputName}`);
  }

  // Copy static reference files
  const referencesDir = path.join(outputDir, "references");
  await fs.ensureDir(referencesDir);

  const refFiles = [
    "supabase-auth-patterns.md",
    "vercel-deploy-checklist.md",
    "llm-pricing-table.md",
  ];

  for (const refFile of refFiles) {
    const srcPath = path.join(templatesDir, "references", refFile);
    const destPath = path.join(referencesDir, refFile);
    await fs.copy(srcPath, destPath);
    created.push(`launchblocks/references/${refFile}`);
  }

  return created;
}
