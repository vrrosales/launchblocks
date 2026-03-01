import path from "node:path";
import { intro, outro, multiselect, isCancel, cancel } from "@clack/prompts";
import { readConfig, VALID_PROVIDERS, VALID_PERMISSIONS } from "../generator/config-reader.js";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "../interview/types.js";
import { generateProject } from "../generator/index.js";
import { parseCommaSeparated } from "../utils/validation.js";
import { toDisplayName } from "../utils/slug.js";
import { logger } from "../utils/logger.js";

interface AddRoleOptions {
  permissions?: string;
  owner?: boolean;
  default?: boolean;
  dryRun?: boolean;
}

interface AddProviderOptions {
  dryRun?: boolean;
}

const REGEN_SCOPE = ["config", "context", "specs", "sql"] as const;

export async function addRoleCommand(
  name: string,
  opts: AddRoleOptions
): Promise<void> {
  try {
    intro("Launchblocks — Add Role");

    // Validate role name format
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      logger.error(
        `Invalid role name "${name}". Use lowercase letters, numbers, and underscores. Must start with a letter.`
      );
      process.exit(1);
    }

    // Find and read existing config
    const configPath = path.join(
      process.cwd(),
      "launchblocks",
      "launchblocks.config.yaml"
    );
    const config = await readConfig(configPath);

    // Error if role already exists
    if (config.roles.some((r) => r.name === name)) {
      logger.error(`Role "${name}" already exists.`);
      process.exit(1);
    }

    // Get permissions
    let permissions: string[];

    if (opts.owner) {
      // Owner gets all permissions
      permissions = [...ALL_PERMISSIONS];
    } else if (opts.permissions) {
      permissions = parseCommaSeparated(opts.permissions);
      for (const perm of permissions) {
        if (!VALID_PERMISSIONS.includes(perm)) {
          logger.error(
            `Unknown permission "${perm}". Valid permissions: ${VALID_PERMISSIONS.join(", ")}`
          );
          process.exit(1);
        }
      }
    } else {
      // Interactive multiselect prompt
      const selected = await multiselect({
        message: `Select permissions for "${toDisplayName(name)}"`,
        options: ALL_PERMISSIONS.map((perm) => ({
          value: perm,
          label: toDisplayName(perm.replace(/_/g, " ")),
          hint: PERMISSION_LABELS[perm],
        })),
        required: false,
      });

      if (isCancel(selected)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      permissions = selected;
    }

    // Handle --owner flag
    if (opts.owner) {
      // Demote the previous owner
      for (const role of config.roles) {
        if (role.is_owner) {
          role.is_owner = false;
        }
      }
      config.owner_role = name;
      // Owner is also an admin
      if (!config.admin_roles.includes(name)) {
        config.admin_roles.push(name);
      }
    }

    // Handle --default flag
    if (opts.default) {
      // Demote the previous default
      for (const role of config.roles) {
        if (role.is_default) {
          role.is_default = false;
        }
      }
      config.default_role = name;
    }

    // Push new role into config
    config.roles.push({
      name,
      display_name: toDisplayName(name),
      is_owner: opts.owner ?? false,
      is_default: opts.default ?? false,
      permissions,
    });

    // Add to llm_access_roles by default
    if (!config.llm_access_roles.includes(name)) {
      config.llm_access_roles.push(name);
    }

    // Regenerate project files
    logger.step("Regenerating project files...");

    if (opts.dryRun) {
      const preview = await generateProject(process.cwd(), config, {
        dryRun: true,
        scope: [...REGEN_SCOPE],
      });
      logger.dryRunSummary(preview);
      return;
    }

    const updatedFiles = await generateProject(process.cwd(), config, {
      scope: [...REGEN_SCOPE],
    });

    logger.success(`Added role "${name}" with ${permissions.length} permissions.`);
    logger.info(`Updated ${updatedFiles.length} files.`);

    outro("Done!");
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "An unexpected error occurred."
    );
    process.exit(1);
  }
}

export async function addProviderCommand(
  name: string,
  opts: AddProviderOptions
): Promise<void> {
  try {
    intro("Launchblocks — Add Provider");

    // Validate provider name
    if (!VALID_PROVIDERS.includes(name)) {
      logger.error(
        `Unknown provider "${name}". Valid providers: ${VALID_PROVIDERS.join(", ")}`
      );
      process.exit(1);
    }

    // Find and read existing config
    const configPath = path.join(
      process.cwd(),
      "launchblocks",
      "launchblocks.config.yaml"
    );
    const config = await readConfig(configPath);

    // Error if provider already configured
    if (config.llm_providers.includes(name)) {
      logger.error(`Provider "${name}" is already configured.`);
      process.exit(1);
    }

    // Push to providers
    config.llm_providers.push(name);

    // Regenerate project files
    logger.step("Regenerating project files...");

    if (opts.dryRun) {
      const preview = await generateProject(process.cwd(), config, {
        dryRun: true,
        scope: [...REGEN_SCOPE],
      });
      logger.dryRunSummary(preview);
      return;
    }

    const updatedFiles = await generateProject(process.cwd(), config, {
      scope: [...REGEN_SCOPE],
    });

    logger.success(`Added provider "${name}".`);
    logger.info(`Updated ${updatedFiles.length} files.`);

    outro("Done!");
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "An unexpected error occurred."
    );
    process.exit(1);
  }
}
