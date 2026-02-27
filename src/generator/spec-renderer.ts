import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import type { LaunchblocksConfig } from "./config-writer.js";
import { getTemplatesDir } from "./template-utils.js";

const BASE_SPEC_FILES = [
  "01-project-setup.md",
  "02-database.md",
  "03-authentication.md",
  "04-user-management.md",
  "05-llm-gateway.md",
  "06-prompt-management.md",
  "07-llm-audit.md",
];

export async function renderSpecs(
  outputDir: string,
  config: LaunchblocksConfig,
  context: Record<string, unknown>
): Promise<string[]> {
  const templatesDir = getTemplatesDir();
  const specsDir = path.join(outputDir, "specs");
  await fs.ensureDir(specsDir);

  const specFiles = [...BASE_SPEC_FILES];
  if (config.include_billing) {
    specFiles.push("08-billing.md");
  }

  const created: string[] = [];

  for (const specFile of specFiles) {
    const templatePath = path.join(templatesDir, "specs", `${specFile}.hbs`);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent, { noEscape: true });
    const rendered = template(context);

    const outPath = path.join(specsDir, specFile);
    await fs.outputFile(outPath, rendered, "utf-8");
    created.push(`launchblocks/specs/${specFile}`);
  }

  return created;
}
