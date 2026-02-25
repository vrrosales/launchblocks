import inquirer from "inquirer";
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

  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message: `These roles will see the admin panel: ${inferred.join(", ")}\n  Is that correct?`,
      default: true,
    },
  ]);

  if (confirmed) return inferred;

  const { adminRoles } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "adminRoles",
      message: "Select roles that should see the admin panel:",
      choices: roles.map((r) => ({
        name: r.name,
        value: r.name,
        checked: inferred.includes(r.name),
      })),
    },
  ]);

  return adminRoles;
}
