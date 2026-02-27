import ora, { type Ora } from "ora";
import chalk from "chalk";

let activeSpinner: Ora | null = null;

export function startPhase(label: string): void {
  activeSpinner = ora({
    text: label,
    prefixText: " ",
    color: "cyan",
  }).start();
}

export function succeedPhase(label: string): void {
  if (activeSpinner) {
    activeSpinner.stopAndPersist({
      symbol: chalk.green("  ✓"),
      text: label,
    });
    activeSpinner = null;
  }
}

export function failPhase(label: string): void {
  if (activeSpinner) {
    activeSpinner.stopAndPersist({
      symbol: chalk.red("  ✗"),
      text: label,
    });
    activeSpinner = null;
  }
}
