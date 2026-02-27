import { runInterview } from "../interview/runner.js";
import {
  ALL_PERMISSIONS,
  DEFAULT_ANSWERS,
  DEFAULT_LLM_PROVIDERS,
  type AiTool,
  type CLIOptions,
  type InterviewAnswers,
  type Permission,
  type RoleConfig,
} from "../interview/types.js";
import { buildConfig } from "../generator/config-writer.js";
import { generateProject, type DryRunFile } from "../generator/index.js";
import { runSetup } from "../setup/runner.js";
import { logger } from "../utils/logger.js";
import { parseCommaSeparated } from "../utils/validation.js";
import { toDisplayName } from "../utils/slug.js";

const VALID_AI_TOOLS = ["claude", "cursor", "codex", "gemini", "all"];
const VALID_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "cohere",
  "xai",
  "deepseek",
  "groq",
];

function buildAnswersFromFlags(opts: CLIOptions): Partial<InterviewAnswers> {
  const partial: Partial<InterviewAnswers> = {};

  if (opts.aiTool) {
    if (!VALID_AI_TOOLS.includes(opts.aiTool)) {
      throw new Error(
        `Invalid --ai-tool "${opts.aiTool}". Must be one of: ${VALID_AI_TOOLS.join(", ")}`
      );
    }
    partial.aiTool = opts.aiTool as AiTool;
  }

  if (opts.appName) {
    const name = opts.appName.trim();
    if (!name || name.length > 100) {
      throw new Error("--app-name must be 1-100 characters.");
    }
    partial.appName = name;
  }

  if (opts.roles) {
    const roleNames = parseCommaSeparated(opts.roles);
    if (roleNames.length < 2) {
      throw new Error("--roles requires at least 2 comma-separated role names.");
    }
    for (const name of roleNames) {
      if (!/^[a-z][a-z0-9_]*$/.test(name)) {
        throw new Error(
          `Invalid role name "${name}". Use lowercase letters, numbers, and underscores. Must start with a letter.`
        );
      }
    }

    const ownerRole = roleNames[0];
    const defaultRole = roleNames[roleNames.length - 1];

    const roles: RoleConfig[] = roleNames.map((name) => ({
      name,
      display_name: toDisplayName(name),
      is_owner_role: name === ownerRole,
      is_default_role: name === defaultRole,
      permissions:
        name === ownerRole ? ([...ALL_PERMISSIONS] as Permission[]) : [],
    }));

    partial.roles = roles;
    partial.ownerRole = ownerRole;
    partial.defaultRole = defaultRole;

    // Infer admin roles: owner + roles with admin-ish permissions
    partial.adminRoles = [ownerRole];

    // Infer LLM access: all roles by default
    partial.llmAccessRoles = roleNames;
  }

  if (opts.requireApproval !== undefined) {
    partial.requireApproval = opts.requireApproval;
  }

  if (opts.llmProviders) {
    const providers = parseCommaSeparated(opts.llmProviders);
    for (const p of providers) {
      if (!VALID_PROVIDERS.includes(p)) {
        throw new Error(
          `Invalid provider "${p}". Must be one of: ${VALID_PROVIDERS.join(", ")}`
        );
      }
    }
    if (providers.length === 0) {
      throw new Error("--llm-providers requires at least one provider.");
    }
    partial.llmProviders = providers;
  }

  if (opts.llmAccess) {
    if (opts.llmAccess === "all") {
      // Will be resolved to all role names once roles are known
      partial.llmAccessRoles = undefined;
    } else {
      partial.llmAccessRoles = parseCommaSeparated(opts.llmAccess);
    }
  }

  return partial;
}

export async function initCommand(opts: CLIOptions): Promise<void> {
  try {
    let answers: InterviewAnswers;

    if (opts.defaults) {
      // --defaults: use recommended defaults, skip interview entirely
      const flagOverrides = buildAnswersFromFlags(opts);
      answers = { ...DEFAULT_ANSWERS, ...flagOverrides };

      // If llmAccess was "all", resolve to all role names
      if (opts.llmAccess === "all" || !opts.llmAccess) {
        answers.llmAccessRoles = answers.roles.map((r) => r.name);
      }

      logger.banner();
      logger.success("Using recommended defaults.");
    } else {
      // Build partial answers from any individual flags
      const flagOverrides = buildAnswersFromFlags(opts);
      const hasOverrides = Object.keys(flagOverrides).length > 0;

      // Run interview, passing any pre-filled answers
      answers = await runInterview(hasOverrides ? flagOverrides : undefined);

      // If llmAccess was "all", resolve to all role names
      if (opts.llmAccess === "all") {
        answers.llmAccessRoles = answers.roles.map((r) => r.name);
      }
    }

    // Step 3: Build the config object
    logger.step("Generating project files...");
    const config = buildConfig(answers);

    if (opts.dryRun) {
      // --dry-run: preview without writing
      const preview = await generateProject(process.cwd(), config, {
        dryRun: true,
      });
      logger.dryRunSummary(preview as DryRunFile[]);
      return;
    }

    // Step 4: Generate all files
    const createdFiles = await generateProject(process.cwd(), config) as string[];

    // Step 5: MCP Server Setup
    let setupResult = null;
    if (!opts.skipMcp) {
      setupResult = await runSetup(answers.aiTool);
    }

    // Step 6: Show summary
    logger.summary(createdFiles, setupResult, answers.aiTool);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("User force closed")
    ) {
      console.log("\n");
      logger.info("Cancelled. No files were created.");
      process.exit(0);
    }
    logger.error(
      error instanceof Error ? error.message : "An unexpected error occurred."
    );
    process.exit(1);
  }
}
