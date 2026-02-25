import type { InterviewAnswers } from "./types.js";
import { askRoles } from "./questions/roles.js";
import { askPermissions } from "./questions/permissions.js";
import { askSignupApproval } from "./questions/signup.js";
import { askAdminAccess } from "./questions/admin-access.js";
import { askLlmAccess } from "./questions/llm-access.js";
import { askProviders } from "./questions/providers.js";
import { askAppInfo } from "./questions/app-info.js";
import { askAiTool } from "./questions/ai-tool.js";
import { logger } from "../utils/logger.js";

export async function runInterview(): Promise<InterviewAnswers> {
  logger.banner();

  // Q1: AI tool
  logger.step("Step 1/8 — AI Tool");
  const aiTool = await askAiTool();

  // Q2: Roles
  logger.step("Step 2/8 — Roles");
  const { roles, ownerRole, defaultRole } = await askRoles();

  // Q3: Permissions (only for custom roles — defaults come pre-configured)
  logger.step("Step 3/8 — Permissions");
  await askPermissions(roles);

  // Q4: Signup approval
  logger.step("Step 4/8 — Signup Behavior");
  const requireApproval = await askSignupApproval();

  // Q5: Admin panel access
  logger.step("Step 5/8 — Admin Panel Access");
  const adminRoles = await askAdminAccess(roles);

  // Q6: LLM access
  logger.step("Step 6/8 — LLM Access");
  const llmAccessRoles = await askLlmAccess(roles);

  // Q7: LLM providers
  logger.step("Step 7/8 — LLM Providers");
  const llmProviders = await askProviders();

  // Q8: App name
  logger.step("Step 8/8 — App Info");
  const appName = await askAppInfo();

  return {
    appName,
    roles,
    ownerRole,
    defaultRole,
    requireApproval,
    adminRoles,
    llmAccessRoles,
    llmProviders,
    aiTool,
  };
}
