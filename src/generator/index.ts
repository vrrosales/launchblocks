import path from "node:path";
import fs from "fs-extra";
import type { LaunchblocksConfig } from "./config-writer.js";
import { writeConfig } from "./config-writer.js";
import { registerHelpers, buildTemplateContext } from "./template-utils.js";
import { renderSpecs } from "./spec-renderer.js";
import { renderSql } from "./sql-renderer.js";
import { renderContextFiles } from "./context-renderer.js";

export async function generateProject(
  targetDir: string,
  config: LaunchblocksConfig
): Promise<string[]> {
  registerHelpers();

  const outputDir = path.join(targetDir, "launchblocks");
  await fs.ensureDir(outputDir);

  const context = buildTemplateContext(config);
  const allFiles: string[] = [];

  // 1. Write config YAML
  await writeConfig(outputDir, config);
  allFiles.push("launchblocks/launchblocks.config.yaml");

  // 2. Render LaunchBlocks_implementation.md + tool context files + references
  const contextFiles = await renderContextFiles(outputDir, config, context);
  allFiles.push(...contextFiles);

  // 3. Render spec files
  const specFiles = await renderSpecs(outputDir, config, context);
  allFiles.push(...specFiles);

  // 4. Render SQL migrations + sample-env
  const sqlFiles = await renderSql(outputDir, config, context);
  allFiles.push(...sqlFiles);

  return allFiles;
}
