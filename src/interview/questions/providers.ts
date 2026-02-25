import inquirer from "inquirer";

export async function askProviders(): Promise<string[]> {
  const { providers } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "providers",
      message: "Which LLM providers will you use?",
      choices: [
        { name: "OpenAI (GPT-4o, etc.)", value: "openai", checked: true },
        { name: "Anthropic (Claude, etc.)", value: "anthropic" },
        { name: "Google (Gemini, etc.)", value: "google" },
      ],
      validate: (input: string[]) =>
        input.length > 0 ? true : "Select at least one provider.",
    },
  ]);

  return providers;
}
