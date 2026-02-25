import inquirer from "inquirer";
import type { AiTool } from "../types.js";

export async function askAiTool(): Promise<AiTool> {
  const { aiTool } = await inquirer.prompt([
    {
      type: "list",
      name: "aiTool",
      message:
        "Which AI coding tool will you use to implement the project?\n  (We'll generate the right context file)\n",
      choices: [
        { name: "Claude Code (CLAUDE.md)", value: "claude" },
        { name: "Cursor (.cursorrules)", value: "cursor" },
        { name: "Codex / OpenAI (AGENTS.md)", value: "codex" },
        { name: "Gemini CLI (GEMINI.md)", value: "gemini" },
        { name: "All of the above", value: "all" },
      ],
    },
  ]);

  return aiTool;
}
