import { intro, log } from "@clack/prompts";
import type { InterviewAnswers } from "./types.js";
import { askRoles } from "./questions/roles.js";
import { askPermissions } from "./questions/permissions.js";
import { askSignupApproval } from "./questions/signup.js";
import { askAdminAccess } from "./questions/admin-access.js";
import { askLlmAccess } from "./questions/llm-access.js";
import { askProviders } from "./questions/providers.js";
import { askAppInfo } from "./questions/app-info.js";
import { askAiTool } from "./questions/ai-tool.js";
import { askBilling } from "./questions/billing.js";

export async function runInterview(
  prefilled?: Partial<InterviewAnswers>
): Promise<InterviewAnswers> {
  intro("Launchblocks — Spec-Driven AI App Foundation");

  // Count how many questions we actually need to ask
  const steps: string[] = [];
  if (!prefilled?.aiTool) steps.push("AI Tool");
  if (!prefilled?.roles) steps.push("Roles");
  if (!prefilled?.roles) steps.push("Permissions");
  if (prefilled?.requireApproval === undefined) steps.push("Signup Behavior");
  if (!prefilled?.adminRoles) steps.push("Admin Panel Access");
  if (!prefilled?.llmAccessRoles) steps.push("LLM Access");
  if (!prefilled?.llmProviders) steps.push("LLM Providers");
  if (!prefilled?.appName) steps.push("App Info");
  if (prefilled?.includeBilling === undefined) steps.push("Billing");

  const totalSteps = steps.length;
  let currentStep = 0;

  function stepLabel(label: string): string {
    currentStep++;
    return `Step ${currentStep}/${totalSteps} — ${label}`;
  }

  // Q1: AI tool
  let aiTool = prefilled?.aiTool;
  if (!aiTool) {
    log.step(stepLabel("AI Tool"));
    aiTool = await askAiTool();
  }

  // Q2: Roles
  let roles = prefilled?.roles;
  let ownerRole = prefilled?.ownerRole;
  let defaultRole = prefilled?.defaultRole;
  if (!roles) {
    log.step(stepLabel("Roles"));
    const result = await askRoles();
    roles = result.roles;
    ownerRole = result.ownerRole;
    defaultRole = result.defaultRole;
  }

  // Q3: Permissions (only for custom roles — defaults come pre-configured)
  if (!prefilled?.roles) {
    log.step(stepLabel("Permissions"));
    await askPermissions(roles);
  }

  // Q4: Signup approval
  let requireApproval = prefilled?.requireApproval;
  if (requireApproval === undefined) {
    log.step(stepLabel("Signup Behavior"));
    requireApproval = await askSignupApproval();
  }

  // Q5: Admin panel access
  let adminRoles = prefilled?.adminRoles;
  if (!adminRoles) {
    log.step(stepLabel("Admin Panel Access"));
    adminRoles = await askAdminAccess(roles);
  }

  // Q6: LLM access
  let llmAccessRoles = prefilled?.llmAccessRoles;
  if (!llmAccessRoles) {
    log.step(stepLabel("LLM Access"));
    llmAccessRoles = await askLlmAccess(roles);
  }

  // Q7: LLM providers
  let llmProviders = prefilled?.llmProviders;
  if (!llmProviders) {
    log.step(stepLabel("LLM Providers"));
    llmProviders = await askProviders();
  }

  // Q8: App name
  let appName = prefilled?.appName;
  if (!appName) {
    log.step(stepLabel("App Info"));
    appName = await askAppInfo();
  }

  // Q9: Billing
  let includeBilling = prefilled?.includeBilling;
  let billingModel = prefilled?.billingModel;
  if (includeBilling === undefined) {
    log.step(stepLabel("Billing"));
    const result = await askBilling();
    includeBilling = result.includeBilling;
    billingModel = result.billingModel;
  }

  return {
    appName,
    roles,
    ownerRole: ownerRole!,
    defaultRole: defaultRole!,
    requireApproval,
    adminRoles,
    llmAccessRoles,
    llmProviders,
    aiTool,
    includeBilling,
    billingModel,
  };
}
