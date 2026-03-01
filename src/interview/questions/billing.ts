import { select, isCancel, cancel } from "@clack/prompts";
import type { BillingModel } from "../types.js";
import { CancellationError } from "../../utils/errors.js";

export async function askBilling(): Promise<{
  includeBilling: boolean;
  billingModel?: BillingModel;
}> {
  const includeBilling = await select({
    message: "Do you want to include a billing module? (Stripe)",
    options: [
      {
        label: "No — skip billing for now",
        value: false,
      },
      {
        label: "Yes — include Stripe billing with subscription plans",
        value: true,
      },
    ],
  });

  if (isCancel(includeBilling)) {
    cancel("Operation cancelled.");
    throw new CancellationError();
  }

  if (!includeBilling) {
    return { includeBilling: false };
  }

  const billingModel = await select({
    message: "Which billing model?",
    options: [
      {
        label: "Subscription (monthly/yearly plans)",
        value: "subscription" as const,
      },
      {
        label: "Usage-based (pay per LLM call)",
        value: "usage" as const,
      },
      {
        label: "Both (subscriptions + usage overages)",
        value: "both" as const,
      },
    ],
  });

  if (isCancel(billingModel)) {
    cancel("Operation cancelled.");
    throw new CancellationError();
  }

  return { includeBilling: true, billingModel };
}
