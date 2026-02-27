import { select, text, isCancel, cancel } from "@clack/prompts";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  type Permission,
  type RoleConfig,
} from "../types.js";
import { validateRoles, parseCommaSeparated } from "../../utils/validation.js";
import { toDisplayName } from "../../utils/slug.js";

export async function askRoles(): Promise<{
  roles: RoleConfig[];
  ownerRole: string;
  defaultRole: string;
}> {
  const roleChoice = await select({
    message:
      'What roles does your application need?\n  Launchblocks requires an "owner" role (full access) and a "default" role (assigned to new signups).',
    options: [
      {
        label: "Use defaults: super_admin, admin, user  (recommended)",
        value: "defaults" as const,
      },
      { label: "Custom roles", value: "custom" as const },
    ],
  });

  if (isCancel(roleChoice)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (roleChoice === "defaults") {
    return {
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
    };
  }

  const roleInput = await text({
    message:
      'Enter your roles (comma-separated, e.g. "owner, editor, viewer"):',
    validate(value) {
      const result = validateRoles(value);
      if (result !== true) return result;
    },
  });

  if (isCancel(roleInput)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const roleNames = parseCommaSeparated(roleInput);

  const ownerRole = await select({
    message: "Which role is the owner role (highest privilege)?",
    options: roleNames.map((name) => ({ label: name, value: name })),
  });

  if (isCancel(ownerRole)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const defaultRole = await select({
    message: "Which role is assigned to new signups by default?",
    options: roleNames.map((name) => ({ label: name, value: name })),
  });

  if (isCancel(defaultRole)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  // Build RoleConfig array — owner gets all perms, others need to be configured later
  const roles: RoleConfig[] = roleNames.map((name) => ({
    name,
    display_name: toDisplayName(name),
    is_owner_role: name === ownerRole,
    is_default_role: name === defaultRole,
    permissions:
      name === ownerRole ? ([...ALL_PERMISSIONS] as Permission[]) : [],
  }));

  return { roles, ownerRole, defaultRole };
}
