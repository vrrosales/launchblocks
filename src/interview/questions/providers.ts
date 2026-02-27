import { multiselect, isCancel, cancel } from "@clack/prompts";

export async function askProviders(): Promise<string[]> {
  const providers = await multiselect({
    message: "Which LLM providers will you use?",
    options: [
      { label: "OpenAI (GPT-4o, etc.)", value: "openai" },
      { label: "Anthropic (Claude, etc.)", value: "anthropic" },
      { label: "Google (Gemini, etc.)", value: "google" },
      { label: "Mistral (Mistral Large, etc.)", value: "mistral" },
      { label: "Cohere (Command R+, etc.)", value: "cohere" },
      { label: "xAI (Grok, etc.)", value: "xai" },
      { label: "DeepSeek (DeepSeek V3, etc.)", value: "deepseek" },
      { label: "Groq (LPU Inference)", value: "groq" },
    ],
    required: true,
  });

  if (isCancel(providers)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return providers;
}
