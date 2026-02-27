import { select, isCancel, cancel } from "@clack/prompts";

export async function askSignupApproval(): Promise<boolean> {
  const requireApproval = await select({
    message:
      "Should new user signups require admin approval before accessing the app?",
    options: [
      {
        label: "Yes — new users wait for approval (recommended)",
        value: true,
      },
      { label: "No — new users get immediate access", value: false },
    ],
  });

  if (isCancel(requireApproval)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return requireApproval;
}
