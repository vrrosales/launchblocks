import inquirer from "inquirer";
import type { RoleConfig } from "../types.js";

export async function askLlmAccess(roles: RoleConfig[]): Promise<string[]> {
  const { llmChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "llmChoice",
      message: "Which roles can use AI/LLM features in the app?",
      choices: [
        { name: "All roles (recommended)", value: "all" },
        { name: "Specific roles only", value: "specific" },
      ],
    },
  ]);

  if (llmChoice === "all") {
    return roles.map((r) => r.name);
  }

  const { llmRoles } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "llmRoles",
      message: "Select roles that can use AI/LLM features:",
      choices: roles.map((r) => ({
        name: r.name,
        value: r.name,
      })),
    },
  ]);

  return llmRoles;
}
