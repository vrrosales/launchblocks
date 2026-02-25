import inquirer from "inquirer";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
  type RoleConfig,
} from "../types.js";
import { logger } from "../../utils/logger.js";

export async function askPermissions(roles: RoleConfig[]): Promise<void> {
  for (const role of roles) {
    if (role.is_owner_role) {
      logger.info(
        `"${role.name}" is the owner role — automatically gets all permissions.`
      );
      role.permissions = [...ALL_PERMISSIONS];
      continue;
    }

    const { perms } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "perms",
        message: `Configure permissions for "${role.name}":`,
        choices: ALL_PERMISSIONS.map((p) => ({
          name: `${p} — ${PERMISSION_LABELS[p]}`,
          value: p,
          checked: role.permissions.includes(p),
        })),
      },
    ]);

    role.permissions = perms as Permission[];
  }
}
