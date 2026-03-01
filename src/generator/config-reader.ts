import fs from "fs-extra";
import YAML from "yaml";
import type { LaunchblocksConfig } from "./config-writer.js";

const VALID_AI_TOOLS = ["claude", "cursor", "codex", "gemini", "all"];
const VALID_BILLING_MODELS = ["subscription", "usage", "both"];
export const VALID_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "cohere",
  "xai",
  "deepseek",
  "groq",
];
export const VALID_PERMISSIONS = [
  "manage_users",
  "manage_roles",
  "manage_prompts",
  "view_audit_log",
  "export_audit_log",
  "manage_settings",
  "manage_providers",
];

export class ConfigValidationError extends Error {
  public readonly errors: string[];
  constructor(errors: string[]) {
    const message = errors.length === 1
      ? `Config error: ${errors[0]}`
      : `Config has ${errors.length} errors:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`;
    super(message);
    this.name = 'ConfigValidationError';
    this.errors = errors;
  }
}

export function validateConfig(raw: unknown): LaunchblocksConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new ConfigValidationError(["file must contain a YAML object."]);
  }

  const obj = raw as Record<string, unknown>;
  const errors: string[] = [];

  // ── Pass 1: Field-level type/format checks ──

  // Required string fields
  let appNameValid = false;
  if (typeof obj.app_name === "string" && obj.app_name.trim() !== "") {
    appNameValid = true;
  } else {
    errors.push('"app_name" must be a non-empty string.');
  }

  let slugValid = false;
  if (typeof obj.slug === "string" && obj.slug.trim() !== "") {
    slugValid = true;
  } else {
    errors.push('"slug" must be a non-empty string.');
  }

  let ownerRoleValid = false;
  if (typeof obj.owner_role === "string" && obj.owner_role.trim() !== "") {
    ownerRoleValid = true;
  } else {
    errors.push('"owner_role" must be a non-empty string.');
  }

  let defaultRoleValid = false;
  if (typeof obj.default_role === "string" && obj.default_role.trim() !== "") {
    defaultRoleValid = true;
  } else {
    errors.push('"default_role" must be a non-empty string.');
  }

  let aiToolValid = false;
  if (typeof obj.ai_tool === "string" && obj.ai_tool.trim() !== "") {
    if (VALID_AI_TOOLS.includes(obj.ai_tool)) {
      aiToolValid = true;
    } else {
      errors.push(`"ai_tool" must be one of: ${VALID_AI_TOOLS.join(", ")}. Got "${obj.ai_tool}".`);
    }
  } else {
    errors.push('"ai_tool" must be a non-empty string.');
  }

  // Boolean fields
  let requireApprovalValid = false;
  if (typeof obj.require_approval === "boolean") {
    requireApprovalValid = true;
  } else {
    errors.push('"require_approval" must be true or false.');
  }

  // Array fields
  let adminRolesValid = false;
  if (Array.isArray(obj.admin_roles) && obj.admin_roles.every((v: unknown) => typeof v === "string")) {
    adminRolesValid = true;
  } else {
    errors.push('"admin_roles" must be an array of strings.');
  }

  let llmAccessRolesValid = false;
  if (Array.isArray(obj.llm_access_roles) && obj.llm_access_roles.every((v: unknown) => typeof v === "string")) {
    llmAccessRolesValid = true;
  } else {
    errors.push('"llm_access_roles" must be an array of strings.');
  }

  let llmProvidersValid = false;
  if (Array.isArray(obj.llm_providers) && obj.llm_providers.every((v: unknown) => typeof v === "string")) {
    if ((obj.llm_providers as string[]).length === 0) {
      errors.push("at least one LLM provider is required.");
    } else {
      llmProvidersValid = true;
      for (const p of obj.llm_providers as string[]) {
        if (!VALID_PROVIDERS.includes(p)) {
          errors.push(`unknown provider "${p}". Valid providers: ${VALID_PROVIDERS.join(", ")}.`);
        }
      }
    }
  } else {
    errors.push('"llm_providers" must be an array of strings.');
  }

  // Validate roles
  const roleNames: string[] = [];
  let rolesValid = false;
  if (!Array.isArray(obj.roles) || obj.roles.length < 2) {
    errors.push("at least 2 roles are required.");
  } else {
    rolesValid = true;
    for (const role of obj.roles as Record<string, unknown>[]) {
      // Validate role fields
      if (typeof role.name !== "string" || role.name.trim() === "") {
        errors.push('"roles[].name" must be a non-empty string.');
      } else {
        roleNames.push(role.name);
      }

      if (typeof role.display_name !== "string" || role.display_name.trim() === "") {
        errors.push('"roles[].display_name" must be a non-empty string.');
      }

      if (typeof role.is_owner !== "boolean") {
        errors.push('"roles[].is_owner" must be true or false.');
      }

      if (typeof role.is_default !== "boolean") {
        errors.push('"roles[].is_default" must be true or false.');
      }

      if (!Array.isArray(role.permissions) || !(role.permissions as unknown[]).every((v: unknown) => typeof v === "string")) {
        errors.push('"roles[].permissions" must be an array of strings.');
      } else {
        for (const perm of role.permissions as string[]) {
          if (!VALID_PERMISSIONS.includes(perm)) {
            errors.push(`unknown permission "${perm}" on role "${role.name}". Valid permissions: ${VALID_PERMISSIONS.join(", ")}.`);
          }
        }
      }
    }
  }

  // ── Pass 2: Cross-field consistency checks ──

  if (roleNames.length > 0) {
    if (ownerRoleValid && !roleNames.includes(obj.owner_role as string)) {
      errors.push(`owner_role "${obj.owner_role}" not found in roles [${roleNames.join(", ")}].`);
    }

    if (defaultRoleValid && !roleNames.includes(obj.default_role as string)) {
      errors.push(`default_role "${obj.default_role}" not found in roles [${roleNames.join(", ")}].`);
    }

    if (adminRolesValid) {
      for (const ar of obj.admin_roles as string[]) {
        if (!roleNames.includes(ar)) {
          errors.push(`admin role "${ar}" not found in roles [${roleNames.join(", ")}].`);
        }
      }
    }

    if (llmAccessRolesValid) {
      for (const lr of obj.llm_access_roles as string[]) {
        if (!roleNames.includes(lr)) {
          errors.push(`LLM access role "${lr}" not found in roles [${roleNames.join(", ")}].`);
        }
      }
    }
  }

  // Billing fields (optional — defaults to false for backwards compatibility)
  let includeBillingValue = false;
  let billingModelValue: string | undefined;
  if (obj.include_billing !== undefined) {
    if (typeof obj.include_billing !== "boolean") {
      errors.push('"include_billing" must be true or false.');
    } else {
      includeBillingValue = obj.include_billing;

      if (obj.include_billing && obj.billing_model !== undefined) {
        if (typeof obj.billing_model !== "string" || obj.billing_model.trim() === "") {
          errors.push('"billing_model" must be a non-empty string.');
        } else if (!VALID_BILLING_MODELS.includes(obj.billing_model)) {
          errors.push(`"billing_model" must be one of: ${VALID_BILLING_MODELS.join(", ")}. Got "${obj.billing_model}".`);
        } else {
          billingModelValue = obj.billing_model;
        }
      }
    }
  }

  // ── Throw if any errors accumulated ──

  if (errors.length > 0) {
    throw new ConfigValidationError(errors);
  }

  // ── Build validated return value ──

  return {
    app_name: obj.app_name as string,
    slug: obj.slug as string,
    roles: (obj.roles as Record<string, unknown>[]).map((r) => ({
      name: r.name as string,
      display_name: r.display_name as string,
      is_owner: r.is_owner as boolean,
      is_default: r.is_default as boolean,
      permissions: r.permissions as string[],
    })),
    owner_role: obj.owner_role as string,
    default_role: obj.default_role as string,
    require_approval: obj.require_approval as boolean,
    admin_roles: obj.admin_roles as string[],
    llm_access_roles: obj.llm_access_roles as string[],
    llm_providers: obj.llm_providers as string[],
    ai_tool: obj.ai_tool as string,
    include_billing: includeBillingValue,
    billing_model: billingModelValue as "subscription" | "usage" | "both" | undefined,
  };
}

export async function readConfig(
  configPath: string
): Promise<LaunchblocksConfig> {
  if (!(await fs.pathExists(configPath))) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const content = await fs.readFile(configPath, "utf-8");

  let parsed: unknown;
  try {
    parsed = YAML.parse(content);
  } catch (err) {
    throw new Error(
      `Failed to parse YAML: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return validateConfig(parsed);
}
