import {
  confirm,
  multiselect,
  isCancel,
  cancel,
} from "@clack/prompts";
import type { RoleConfig } from "../types.js";

export async function askAdminAccess(
  roles: RoleConfig[]
): Promise<string[]> {
  // Auto-infer: roles with at least one admin-ish permission
  const adminPerms = [
    "manage_users",
    "manage_roles",
    "manage_settings",
    "manage_providers",
  ];

  const inferred = roles
    .filter(
      (r) =>
        r.is_owner_role ||
        r.permissions.some((p) => adminPerms.includes(p))
    )
    .map((r) => r.name);

  if (inferred.length === 0) {
    // Fallback: at least the owner role should see admin panel
    const ownerRole = roles.find((r) => r.is_owner_role);
    if (ownerRole) inferred.push(ownerRole.name);
  }

  const confirmed = await confirm({
    message: `These roles will see the admin panel: ${inferred.join(", ")}\n  Is that correct?`,
    initialValue: true,
  });

  if (isCancel(confirmed)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (confirmed) return inferred;

  const adminRoles = await multiselect({
    message: "Select roles that should see the admin panel:",
    options: roles.map((r) => ({
      label: r.name,
      value: r.name,
    })),
    required: true,
  });

  if (isCancel(adminRoles)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return adminRoles;
}
