import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import type { LaunchblocksConfig } from "./config-writer.js";

export interface ProviderDisplay {
  id: string;
  name: string;
  env_var: string;
  env_placeholder: string;
  env_docs_url: string;
}

export interface RolePermissionSummary {
  name: string;
  display_name: string;
  is_owner: boolean;
  is_default: boolean;
  permissions: string[];
  permissions_list: string;
  has_permissions: boolean;
}

export interface PermissionFlat {
  role: string;
  permission: string;
}

export interface TemplateContext {
  app_name: string;
  slug: string;
  roles: LaunchblocksConfig['roles'];
  role_names: string[];
  role_names_joined: string;
  owner_role: string;
  owner_role_display: string;
  default_role: string;
  default_role_display: string;
  require_approval: boolean;
  approval_status: string;
  admin_roles: string[];
  admin_roles_joined: string;
  llm_access_roles: string[];
  llm_access_roles_joined: string;
  llm_providers: string[];
  providers_display: ProviderDisplay[];
  ai_tool: string;
  permissions_flat: PermissionFlat[];
  role_permission_summary: RolePermissionSummary[];
  has_multiple_providers: boolean;
  all_roles_have_llm: boolean;
  include_billing: boolean;
  billing_model: string | undefined;
  is_subscription: boolean;
  is_usage_based: boolean;
  is_billing_both: boolean;
}

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
  Handlebars.registerHelper(
    "taskId",
    (moduleNumber: number, taskIndex: number) => `${moduleNumber}.${taskIndex}`
  );
  Handlebars.registerHelper(
    "verifyStep",
    (text: string) =>
      typeof text === "string"
        ? new Handlebars.SafeString(`**Verify:** ${text}`)
        : ""
  );
}

export function buildTemplateContext(
  config: LaunchblocksConfig
): TemplateContext {
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
    mistral: "Mistral",
    cohere: "Cohere",
    xai: "xAI",
    deepseek: "DeepSeek",
    groq: "Groq",
  };

  // Provider environment variable metadata
  const providerEnvVars: Record<string, { envVar: string; placeholder: string; docsUrl: string }> = {
    openai: { envVar: "OPENAI_API_KEY", placeholder: "sk-your-openai-key", docsUrl: "https://platform.openai.com/api-keys" },
    anthropic: { envVar: "ANTHROPIC_API_KEY", placeholder: "sk-ant-your-anthropic-key", docsUrl: "https://console.anthropic.com/settings/keys" },
    google: { envVar: "GOOGLE_AI_API_KEY", placeholder: "your-google-ai-key", docsUrl: "https://aistudio.google.com/app/apikey" },
    mistral: { envVar: "MISTRAL_API_KEY", placeholder: "your-mistral-key", docsUrl: "https://console.mistral.ai/api-keys" },
    cohere: { envVar: "CO_API_KEY", placeholder: "your-cohere-key", docsUrl: "https://dashboard.cohere.com/api-keys" },
    xai: { envVar: "XAI_API_KEY", placeholder: "your-xai-key", docsUrl: "https://console.x.ai" },
    deepseek: { envVar: "DEEPSEEK_API_KEY", placeholder: "your-deepseek-key", docsUrl: "https://platform.deepseek.com/api_keys" },
    groq: { envVar: "GROQ_API_KEY", placeholder: "your-groq-key", docsUrl: "https://console.groq.com/keys" },
  };

  const providersDisplay = config.llm_providers.map((p) => ({
    id: p,
    name: providerNames[p] || p,
    env_var: providerEnvVars[p]?.envVar || `${p.toUpperCase()}_API_KEY`,
    env_placeholder: providerEnvVars[p]?.placeholder || `your-${p}-key`,
    env_docs_url: providerEnvVars[p]?.docsUrl || "",
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
    include_billing: config.include_billing,
    billing_model: config.billing_model,
    is_subscription: config.billing_model === "subscription" || config.billing_model === "both",
    is_usage_based: config.billing_model === "usage" || config.billing_model === "both",
    is_billing_both: config.billing_model === "both",
  };
}
