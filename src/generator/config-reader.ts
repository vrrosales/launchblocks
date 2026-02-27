import fs from "fs-extra";
import YAML from "yaml";
import type { LaunchblocksConfig } from "./config-writer.js";

const VALID_AI_TOOLS = ["claude", "cursor", "codex", "gemini", "all"];
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

function assertString(
  value: unknown,
  field: string
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Config error: "${field}" must be a non-empty string.`);
  }
}

function assertBoolean(
  value: unknown,
  field: string
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Config error: "${field}" must be true or false.`);
  }
}

function assertStringArray(
  value: unknown,
  field: string
): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new Error(
      `Config error: "${field}" must be an array of strings.`
    );
  }
}

export function validateConfig(raw: unknown): LaunchblocksConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config error: file must contain a YAML object.");
  }

  const obj = raw as Record<string, unknown>;

  // Required string fields
  assertString(obj.app_name, "app_name");
  assertString(obj.slug, "slug");
  assertString(obj.owner_role, "owner_role");
  assertString(obj.default_role, "default_role");
  assertString(obj.ai_tool, "ai_tool");

  // Boolean fields
  assertBoolean(obj.require_approval, "require_approval");

  // Array fields
  assertStringArray(obj.admin_roles, "admin_roles");
  assertStringArray(obj.llm_access_roles, "llm_access_roles");
  assertStringArray(obj.llm_providers, "llm_providers");

  // Validate ai_tool
  if (!VALID_AI_TOOLS.includes(obj.ai_tool as string)) {
    throw new Error(
      `Config error: "ai_tool" must be one of: ${VALID_AI_TOOLS.join(", ")}. Got "${obj.ai_tool}".`
    );
  }

  // Validate providers
  for (const p of obj.llm_providers as string[]) {
    if (!VALID_PROVIDERS.includes(p)) {
      throw new Error(
        `Config error: unknown provider "${p}". Valid providers: ${VALID_PROVIDERS.join(", ")}.`
      );
    }
  }
  if ((obj.llm_providers as string[]).length === 0) {
    throw new Error("Config error: at least one LLM provider is required.");
  }

  // Validate roles
  if (!Array.isArray(obj.roles) || obj.roles.length < 2) {
    throw new Error("Config error: at least 2 roles are required.");
  }

  const roleNames: string[] = [];
  for (const role of obj.roles as Record<string, unknown>[]) {
    assertString(role.name, "roles[].name");
    assertString(role.display_name, "roles[].display_name");
    assertBoolean(role.is_owner, "roles[].is_owner");
    assertBoolean(role.is_default, "roles[].is_default");
    assertStringArray(role.permissions, "roles[].permissions");

    for (const perm of role.permissions as string[]) {
      if (!VALID_PERMISSIONS.includes(perm)) {
        throw new Error(
          `Config error: unknown permission "${perm}" on role "${role.name}". Valid permissions: ${VALID_PERMISSIONS.join(", ")}.`
        );
      }
    }

    roleNames.push(role.name as string);
  }

  // Validate owner_role exists in roles
  if (!roleNames.includes(obj.owner_role as string)) {
    throw new Error(
      `Config error: owner_role "${obj.owner_role}" not found in roles [${roleNames.join(", ")}].`
    );
  }

  // Validate default_role exists in roles
  if (!roleNames.includes(obj.default_role as string)) {
    throw new Error(
      `Config error: default_role "${obj.default_role}" not found in roles [${roleNames.join(", ")}].`
    );
  }

  // Validate admin_roles exist in roles
  for (const ar of obj.admin_roles as string[]) {
    if (!roleNames.includes(ar)) {
      throw new Error(
        `Config error: admin role "${ar}" not found in roles [${roleNames.join(", ")}].`
      );
    }
  }

  // Validate llm_access_roles exist in roles
  for (const lr of obj.llm_access_roles as string[]) {
    if (!roleNames.includes(lr)) {
      throw new Error(
        `Config error: LLM access role "${lr}" not found in roles [${roleNames.join(", ")}].`
      );
    }
  }

  return obj as unknown as LaunchblocksConfig;
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
