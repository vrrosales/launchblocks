import { multiselect, isCancel, cancel, log } from "@clack/prompts";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type RoleConfig,
} from "../types.js";

export async function askPermissions(roles: RoleConfig[]): Promise<void> {
  for (const role of roles) {
    if (role.is_owner_role) {
      log.info(
        `"${role.name}" is the owner role — automatically gets all permissions.`
      );
      role.permissions = [...ALL_PERMISSIONS];
      continue;
    }

    const perms = await multiselect({
      message: `Configure permissions for "${role.name}":`,
      options: ALL_PERMISSIONS.map((p) => ({
        label: `${p} — ${PERMISSION_LABELS[p]}`,
        value: p,
      })),
      required: false,
    });

    if (isCancel(perms)) {
      cancel("Operation cancelled.");
      process.exit(0);
    }

    role.permissions = perms;
  }
}
