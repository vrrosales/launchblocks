import { select, multiselect, isCancel, cancel } from "@clack/prompts";
import type { RoleConfig } from "../types.js";

export async function askLlmAccess(roles: RoleConfig[]): Promise<string[]> {
  const llmChoice = await select({
    message: "Which roles can use AI/LLM features in the app?",
    options: [
      { label: "All roles (recommended)", value: "all" as const },
      { label: "Specific roles only", value: "specific" as const },
    ],
  });

  if (isCancel(llmChoice)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (llmChoice === "all") {
    return roles.map((r) => r.name);
  }

  const llmRoles = await multiselect({
    message: "Select roles that can use AI/LLM features:",
    options: roles.map((r) => ({
      label: r.name,
      value: r.name,
    })),
    required: true,
  });

  if (isCancel(llmRoles)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return llmRoles;
}
