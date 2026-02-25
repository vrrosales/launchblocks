export function validateRoles(input: string): string | true {
  const trimmed = input.trim();
  if (!trimmed) return "Please enter at least one role.";

  const roles = trimmed.split(",").map((r) => r.trim());
  if (roles.length < 2) return "You need at least 2 roles.";

  for (const role of roles) {
    if (!/^[a-z][a-z0-9_]*$/.test(role)) {
      return `Invalid role name "${role}". Use lowercase letters, numbers, and underscores. Must start with a letter.`;
    }
  }

  const unique = new Set(roles);
  if (unique.size !== roles.length) return "Role names must be unique.";

  return true;
}

export function validateAppName(input: string): string | true {
  const trimmed = input.trim();
  if (!trimmed) return "Please enter an app name.";
  if (trimmed.length > 100) return "App name must be 100 characters or fewer.";
  return true;
}

export function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
