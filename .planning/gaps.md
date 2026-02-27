# UX Gap Analysis — Key Findings

I analyzed 15+ competing tools across three categories (CLI scaffolders, spec-driven development tools, SaaS boilerplates) and reviewed 2025-2026 CLI/DX best practices. The full report is in RESEARCH-UX-GAPS.md.

## Launchblocks' Unique Strengths

- Only spec-driven scaffolder for AI-powered apps — no direct competitor does this
- Aligned with the SDD movement (now on Thoughtworks Radar, endorsed by Martin Fowler, GitHub)
- AI-tool agnostic, fast, local, free, with production-grade SQL

## Top 10 UX Gaps (Priority Ranked)

| #  | Gap | What competitors do better |
|----|-----|---------------------------|
| 1  | No `--defaults` flag | create-next-app collapses 7 questions into 1 with "Use recommended defaults?" |
| 2  | No task decomposition in specs | GitHub Spec Kit breaks specs into ordered, numbered tasks — AI agents perform dramatically better with these |
| 3  | No `--dry-run` mode | Industry standard for trust-building; lets users preview output before writing |
| 4  | No config file reuse | Generates `launchblocks.config.yaml` but can't consume it for regeneration |
| 5  | No annotated file tree summary | Post-generation shows a flat file list; should show a tree with descriptions |
| 6  | No `launchblocks add` command | Only supports greenfield; no way to add a role/provider/module incrementally |
| 7  | No Billing/Stripe module | Every competitor (Supastarter, Makerkit, ShipFast) includes payments |
| 8  | No test specifications | Tessl couples every spec with test definitions — a major quality signal |
| 9  | No CLI flags for automation | Can't use in CI/scripts; every option should be passable as a flag |
| 10 | Not positioned as "SDD" | Launchblocks was doing spec-driven development before the term went mainstream |

## Additional UX Polish Gaps

- No spinners/progress animation during generation (Evil Martians: "if you can only add one improvement, make it progress displays")
- Using `inquirer` instead of `@clack/prompts` (modern CLI prompt library with much better visual design)
- Next steps printed in gray (should be prominent and copy-pasteable)
- No `create-launchblocks` npm alias for discoverability
