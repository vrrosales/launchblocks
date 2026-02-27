#!/usr/bin/env node

import { execFileSync } from "node:child_process";

// Delegate to `launchblocks init` with any arguments passed through
const args = ["launchblocks", "init", ...process.argv.slice(2)];

try {
  execFileSync("npx", args, { stdio: "inherit" });
} catch {
  process.exit(1);
}
