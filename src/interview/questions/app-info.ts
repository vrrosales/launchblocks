import { text, isCancel, cancel } from "@clack/prompts";
import { validateAppName } from "../../utils/validation.js";

export async function askAppInfo(): Promise<string> {
  const appName = await text({
    message: "What is your application's name?",
    defaultValue: "My App",
    placeholder: "My App",
    validate(value) {
      const result = validateAppName(value ?? "");
      if (result !== true) return result;
    },
  });

  if (isCancel(appName)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return appName.trim();
}
