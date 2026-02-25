import { runInterview } from "../interview/runner.js";
import { buildConfig } from "../generator/config-writer.js";
import { generateProject } from "../generator/index.js";
import { logger } from "../utils/logger.js";

export async function initCommand(): Promise<void> {
  try {
    // Step 1–2: Welcome banner + run the interview
    const answers = await runInterview();

    // Step 3: Build the config object
    logger.step("Generating project files...");
    const config = buildConfig(answers);

    // Step 4: Generate all files
    const createdFiles = await generateProject(process.cwd(), config);

    // Step 5: Show summary
    logger.summary(createdFiles);
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
