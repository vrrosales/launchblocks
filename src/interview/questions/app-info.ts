import inquirer from "inquirer";
import { validateAppName } from "../../utils/validation.js";

export async function askAppInfo(): Promise<string> {
  const { appName } = await inquirer.prompt([
    {
      type: "input",
      name: "appName",
      message: "What is your application's name?",
      default: "My App",
      validate: validateAppName,
    },
  ]);

  return appName.trim();
}
