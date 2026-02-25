import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import type { VibekitConfig } from "./config-writer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getTemplatesDir(): string {
  // In dev: src/templates, in built: dist/templates
  // We ship templates alongside the built JS
  // tsup copies them via the package — we resolve relative to this file
  // At build time, this file is at dist/generator/template-utils.js
  // Templates are at dist/templates/
  // At dev time, this file is at src/generator/template-utils.ts
  // Templates are at src/templates/
  return path.resolve(__dirname, "..", "templates");
}

export function registerHelpers(): void {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("neq", (a, b) => a !== b);
  Handlebars.registerHelper("includes", (arr: unknown[], val: unknown) =>
    Array.isArray(arr) ? arr.includes(val) : false
  );
  Handlebars.registerHelper("join", (arr: string[], sep: string) =>
    Array.isArray(arr) ? arr.join(typeof sep === "string" ? sep : ", ") : ""
  );
  Handlebars.registerHelper("uppercase", (str: string) =>
    typeof str === "string" ? str.toUpperCase() : ""
  );
  Handlebars.registerHelper(
    "ifCond",
    function (this: unknown, v1: unknown, operator: string, v2: unknown, options: Handlebars.HelperOptions) {
      switch (operator) {
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!==":
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    }
  );
}

export function buildTemplateContext(
  config: VibekitConfig
): Record<string, unknown> {
  const ownerRoleObj = config.roles.find((r) => r.is_owner);
  const defaultRoleObj = config.roles.find((r) => r.is_default);

  // Flatten permissions for SQL seeding
  const permissionsFlat: { role: string; permission: string }[] = [];
  for (const role of config.roles) {
    for (const perm of role.permissions) {
      permissionsFlat.push({ role: role.name, permission: perm });
    }
  }

  // Build role-permission summary for specs
  const rolePermissionSummary = config.roles.map((r) => ({
    ...r,
    permissions_list:
      r.permissions.length > 0 ? r.permissions.join(", ") : "none",
    has_permissions: r.permissions.length > 0,
  }));

  // Provider display names
  const providerNames: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
  };

  const providersDisplay = config.llm_providers.map((p) => ({
    id: p,
    name: providerNames[p] || p,
  }));

  return {
    app_name: config.app_name,
    slug: config.slug,
    roles: config.roles,
    role_names: config.roles.map((r) => r.name),
    role_names_joined: config.roles.map((r) => r.name).join(", "),
    owner_role: config.owner_role,
    owner_role_display: ownerRoleObj?.display_name || config.owner_role,
    default_role: config.default_role,
    default_role_display: defaultRoleObj?.display_name || config.default_role,
    require_approval: config.require_approval,
    approval_status: config.require_approval ? "pending_approval" : "approved",
    admin_roles: config.admin_roles,
    admin_roles_joined: config.admin_roles.join(", "),
    llm_access_roles: config.llm_access_roles,
    llm_access_roles_joined: config.llm_access_roles.join(", "),
    llm_providers: config.llm_providers,
    providers_display: providersDisplay,
    ai_tool: config.ai_tool,
    permissions_flat: permissionsFlat,
    role_permission_summary: rolePermissionSummary,
    has_multiple_providers: config.llm_providers.length > 1,
    all_roles_have_llm: config.llm_access_roles.length === config.roles.length,
  };
}
