import inquirer from "inquirer";
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
  const { roleChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "roleChoice",
      message:
        'What roles does your application need?\n  Launchblocks requires an "owner" role (full access) and a "default" role (assigned to new signups).\n',
      choices: [
        {
          name: "Use defaults: super_admin, admin, user  (recommended)",
          value: "defaults",
        },
        { name: "Custom roles", value: "custom" },
      ],
    },
  ]);

  if (roleChoice === "defaults") {
    return {
      roles: DEFAULT_ROLES,
      ownerRole: "super_admin",
      defaultRole: "user",
    };
  }

  const { roleInput } = await inquirer.prompt([
    {
      type: "input",
      name: "roleInput",
      message:
        'Enter your roles (comma-separated, e.g. "owner, editor, viewer"):',
      validate: validateRoles,
    },
  ]);

  const roleNames = parseCommaSeparated(roleInput);

  const { ownerRole } = await inquirer.prompt([
    {
      type: "list",
      name: "ownerRole",
      message: "Which role is the owner role (highest privilege)?",
      choices: roleNames,
    },
  ]);

  const { defaultRole } = await inquirer.prompt([
    {
      type: "list",
      name: "defaultRole",
      message: "Which role is assigned to new signups by default?",
      choices: roleNames,
    },
  ]);

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
