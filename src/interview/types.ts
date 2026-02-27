export const ALL_PERMISSIONS = [
  "manage_users",
  "manage_roles",
  "manage_prompts",
  "view_audit_log",
  "export_audit_log",
  "manage_settings",
  "manage_providers",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: "View user list, approve/suspend accounts",
  manage_roles: "Change user roles",
  manage_prompts: "Create/edit/delete prompt templates",
  view_audit_log: "View LLM audit trail and cost data",
  export_audit_log: "Export audit data as CSV",
  manage_settings: "Modify application settings",
  manage_providers: "Add/edit LLM provider configs",
};

export interface RoleConfig {
  name: string;
  display_name: string;
  is_owner_role: boolean;
  is_default_role: boolean;
  permissions: Permission[];
}

export type AiTool = "claude" | "cursor" | "codex" | "gemini" | "all";

export interface InterviewAnswers {
  appName: string;
  roles: RoleConfig[];
  ownerRole: string;
  defaultRole: string;
  requireApproval: boolean;
  adminRoles: string[];
  llmAccessRoles: string[];
  llmProviders: string[];
  aiTool: AiTool;
}

export const DEFAULT_ROLES: RoleConfig[] = [
  {
    name: "super_admin",
    display_name: "Super Admin",
    is_owner_role: true,
    is_default_role: false,
    permissions: [...ALL_PERMISSIONS],
  },
  {
    name: "admin",
    display_name: "Admin",
    is_owner_role: false,
    is_default_role: false,
    permissions: [
      "manage_users",
      "manage_prompts",
      "view_audit_log",
      "export_audit_log",
      "manage_settings",
    ],
  },
  {
    name: "user",
    display_name: "User",
    is_owner_role: false,
    is_default_role: true,
    permissions: [],
  },
];

export const DEFAULT_LLM_PROVIDERS = ["openai"];

export interface CLIOptions {
  defaults?: boolean;
  dryRun?: boolean;
  appName?: string;
  roles?: string;
  requireApproval?: boolean;
  noRequireApproval?: boolean;
  llmProviders?: string;
  llmAccess?: string;
  aiTool?: AiTool;
  skipMcp?: boolean;
}

export const DEFAULT_ANSWERS: InterviewAnswers = {
  appName: "My App",
  roles: DEFAULT_ROLES,
  ownerRole: "super_admin",
  defaultRole: "user",
  requireApproval: true,
  adminRoles: ["super_admin", "admin"],
  llmAccessRoles: ["super_admin", "admin", "user"],
  llmProviders: DEFAULT_LLM_PROVIDERS,
  aiTool: "claude",
};
