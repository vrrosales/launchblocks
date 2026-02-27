import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import type { LaunchblocksConfig } from "./config-writer.js";
import { writeConfig } from "./config-writer.js";
import { registerHelpers, buildTemplateContext } from "./template-utils.js";
import { renderSpecs } from "./spec-renderer.js";
import { renderSql } from "./sql-renderer.js";
import { renderContextFiles } from "./context-renderer.js";
import { startPhase, succeedPhase, failPhase } from "../utils/spinner.js";

export interface DryRunFile {
  path: string;
  size: number;
}

export interface GenerateOptions {
  dryRun?: boolean;
}

export async function generateProject(
  targetDir: string,
  config: LaunchblocksConfig,
  options?: GenerateOptions
): Promise<string[] | DryRunFile[]> {
  registerHelpers();

  const dryRun = options?.dryRun ?? false;
  const showSpinners = !dryRun;

  // In dry-run mode, render to a temp directory so we can measure sizes
  // without writing to the real output location
  const effectiveTarget = dryRun
    ? await fs.mkdtemp(path.join(os.tmpdir(), "launchblocks-"))
    : targetDir;

  const outputDir = path.join(effectiveTarget, "launchblocks");
  await fs.ensureDir(outputDir);

  const context = buildTemplateContext(config);
  const allFiles: string[] = [];

  // 1. Write config YAML
  if (showSpinners) startPhase("Writing config...");
  try {
    await writeConfig(outputDir, config);
    allFiles.push("launchblocks/launchblocks.config.yaml");
    if (showSpinners) succeedPhase("launchblocks.config.yaml");
  } catch (err) {
    if (showSpinners) failPhase("Config write failed");
    throw err;
  }

  // 2. Render LaunchBlocks_implementation.md + tool context files + references
  if (showSpinners) startPhase("Rendering context files...");
  try {
    const contextFiles = await renderContextFiles(outputDir, config, context);
    allFiles.push(...contextFiles);
    if (showSpinners)
      succeedPhase(
        `Master spec + context files + ${contextFiles.filter((f) => f.includes("references/")).length} references`
      );
  } catch (err) {
    if (showSpinners) failPhase("Context rendering failed");
    throw err;
  }

  // 3. Render spec files
  if (showSpinners) startPhase("Rendering module specs...");
  try {
    const specFiles = await renderSpecs(outputDir, config, context);
    allFiles.push(...specFiles);
    if (showSpinners) succeedPhase(`${specFiles.length} module specs`);
  } catch (err) {
    if (showSpinners) failPhase("Spec rendering failed");
    throw err;
  }

  // 4. Render SQL migrations + sample-env
  if (showSpinners) startPhase("Rendering SQL migrations...");
  try {
    const sqlFiles = await renderSql(outputDir, config, context);
    allFiles.push(...sqlFiles);
    const migrationCount = sqlFiles.filter((f) =>
      f.includes("migrations/")
    ).length;
    if (showSpinners)
      succeedPhase(`${migrationCount} SQL migrations + sample-env`);
  } catch (err) {
    if (showSpinners) failPhase("SQL rendering failed");
    throw err;
  }

  if (dryRun) {
    // Collect file sizes from the temp directory
    const dryRunFiles: DryRunFile[] = [];
    for (const filePath of allFiles) {
      const fullPath = path.join(effectiveTarget, filePath);
      try {
        const stat = await fs.stat(fullPath);
        dryRunFiles.push({ path: filePath, size: stat.size });
      } catch {
        dryRunFiles.push({ path: filePath, size: 0 });
      }
    }

    // Clean up temp directory
    await fs.remove(effectiveTarget);

    return dryRunFiles;
  }

  return allFiles;
}
