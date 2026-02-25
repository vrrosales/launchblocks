import inquirer from "inquirer";

export async function askSignupApproval(): Promise<boolean> {
  const { requireApproval } = await inquirer.prompt([
    {
      type: "list",
      name: "requireApproval",
      message:
        "Should new user signups require admin approval before accessing the app?",
      choices: [
        {
          name: "Yes — new users wait for approval (recommended)",
          value: true,
        },
        { name: "No — new users get immediate access", value: false },
      ],
    },
  ]);

  return requireApproval;
}
