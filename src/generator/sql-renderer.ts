import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import type { LaunchblocksConfig } from "./config-writer.js";
import { getTemplatesDir } from "./template-utils.js";
import type { TemplateContext } from "./template-utils.js";

const BASE_SQL_FILES = [
  "001_roles_and_permissions.sql",
  "002_users_and_profiles.sql",
  "003_prompt_templates.sql",
  "004_llm_audit_log.sql",
];

export async function renderSql(
  outputDir: string,
  config: LaunchblocksConfig,
  context: TemplateContext
): Promise<string[]> {
  const templatesDir = getTemplatesDir();
  const migrationsDir = path.join(outputDir, "schemas", "migrations");
  await fs.ensureDir(migrationsDir);

  const sqlFiles = [...BASE_SQL_FILES];
  if (config.include_billing) {
    sqlFiles.push("005_billing.sql");
  }

  const created: string[] = [];

  for (const sqlFile of sqlFiles) {
    const templatePath = path.join(
      templatesDir,
      "schemas",
      `${sqlFile}.hbs`
    );
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent, { noEscape: true });
    const rendered = template(context);

    const outPath = path.join(migrationsDir, sqlFile);
    await fs.outputFile(outPath, rendered, "utf-8");
    created.push(`launchblocks/schemas/migrations/${sqlFile}`);
  }

  // Also render sample-env
  const sampleEnvTemplatePath = path.join(
    templatesDir,
    "schemas",
    "sample-env.md.hbs"
  );
  const sampleEnvTemplate = await fs.readFile(sampleEnvTemplatePath, "utf-8");
  const sampleEnvCompiled = Handlebars.compile(sampleEnvTemplate, {
    noEscape: true,
  });
  const sampleEnvRendered = sampleEnvCompiled(context);
  const sampleEnvPath = path.join(outputDir, "schemas", "sample-env.md");
  await fs.outputFile(sampleEnvPath, sampleEnvRendered, "utf-8");
  created.push("launchblocks/schemas/sample-env.md");

  return created;
}
