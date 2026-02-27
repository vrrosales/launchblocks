import { select, isCancel, cancel } from "@clack/prompts";
import type { AiTool } from "../types.js";

export async function askAiTool(): Promise<AiTool> {
  const aiTool = await select({
    message:
      "Which AI coding tool will you use to implement the project?\n  (We'll generate the right context file)",
    options: [
      { label: "Claude Code (CLAUDE.md)", value: "claude" as const },
      { label: "Cursor (.cursorrules)", value: "cursor" as const },
      { label: "Codex / OpenAI (AGENTS.md)", value: "codex" as const },
      { label: "Gemini CLI (GEMINI.md)", value: "gemini" as const },
      { label: "All of the above", value: "all" as const },
    ],
  });

  if (isCancel(aiTool)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return aiTool;
}
