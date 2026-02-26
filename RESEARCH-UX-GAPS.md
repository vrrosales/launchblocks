# Launchblocks UX Gap Analysis

> Research date: February 2026
> Method: Competitive analysis of 15+ tools, review of 2025-2026 CLI/DX best practices, analysis of current Launchblocks UX touchpoints

---

## Executive Summary

Launchblocks occupies a unique and strategically sound position: **spec-driven scaffolding for AI-powered apps**. This aligns with the hottest trend in AI-assisted development (Spec-Driven Development, now on the Thoughtworks Radar). However, the current UX has significant gaps compared to both CLI scaffolding peers (create-t3-app, create-next-app, Wasp) and the emerging spec-driven tool category (GitHub Spec Kit, Amazon Kiro, Tessl).

The gaps fall into **6 categories**, ranked by impact:

| Priority | Category | Effort | Impact |
|----------|----------|--------|--------|
| 1 | CLI Convenience & Power-User Support | Low | High |
| 2 | Post-Generation Experience | Low-Medium | High |
| 3 | Iterative & Incremental Workflows | Medium | High |
| 4 | Spec Quality & AI-Agent Optimization | Medium | High |
| 5 | Missing Feature Modules | Medium | Medium |
| 6 | Discoverability & Positioning | Low | Medium |

---

## Current State: What Launchblocks Does Well

Before the gaps, it's worth noting the strengths:

- **Unique spec-driven approach** — generates specifications, not code. This gives the user full control over implementation and avoids framework lock-in.
- **AI-tool agnostic** — supports Claude Code, Cursor, Codex, and Gemini with tool-specific context files.
- **Fast, local, free** — no API calls, no accounts, no network dependency. Generation is instant.
- **Production-grade SQL** — 4 migration files with RLS policies, constraints, indexes, and triggers ready to run in Supabase.
- **Clean 8-step interview** — structured, with sensible defaults, progress indicators (Step X/8), and inline help.
- **Graceful error handling** — Ctrl+C handled cleanly, validation errors are specific and helpful.

---

## Gap 1: CLI Convenience & Power-User Support

### What competitors do

| Feature | create-next-app | create-t3-app | Wasp | Yeoman |
|---------|----------------|---------------|------|--------|
| `--defaults` flag (skip all prompts) | Yes ("Use recommended defaults?") | Partial | Yes (`-t saas`) | Yes (`store: true`) |
| CLI flags for every option | Yes (`--typescript`, `--tailwind`, etc.) | Yes | Yes | Yes (arguments + options) |
| `--dry-run` mode | — | — | — | — |
| Config file reuse | Yes ("Reuse previous settings") | — | — | Yes (`.yo-rc.json`) |
| Non-interactive / CI mode | Yes (`--yes`) | Yes | Yes | Yes |

### What Launchblocks is missing

**1.1 No `--defaults` or quick-start flag**
The 8-step interview is always mandatory. create-next-app's breakthrough UX insight was a meta-prompt: "Would you like to use the recommended defaults?" — collapsing 7 questions into 1 for 90% of users.

> **Recommendation:** Add `launchblocks init --defaults` that uses the default roles (super_admin, admin, user), approval required, all providers, app name "My App", and the selected AI tool as the only required argument: `launchblocks init --defaults --tool claude`.

**1.2 No CLI flags for individual options**
Every prompt answer should be passable as a flag for scripted/CI usage:
```
launchblocks init \
  --tool claude \
  --roles "owner,editor,viewer" \
  --owner-role owner \
  --default-role viewer \
  --approve-signup \
  --providers openai,anthropic \
  --name "My AI App"
```

**1.3 No `--dry-run` mode**
Users cannot preview what files will be generated without actually writing them. This is an industry standard for trust-building. The Build Skill CLI, Yeoman, and many modern tools support this.

> **Recommendation:** Add `--dry-run` that prints the file tree that would be generated, with file sizes, without writing anything.

**1.4 No config file reuse / regeneration**
Launchblocks generates `launchblocks.config.yaml` but cannot consume it. If a user wants to regenerate specs after tweaking the config, they must re-answer all 8 questions.

> **Recommendation:** Add `launchblocks init --config ./launchblocks/launchblocks.config.yaml` to regenerate from a saved config file without re-running the interview.

**1.5 No `npx create-launchblocks` alias**
Developers associate the `create-*` pattern with scaffolding tools. `npx create-launchblocks` would improve discoverability on npm.

---

## Gap 2: Post-Generation Experience

### What competitors do

- **create-t3-app**: Provides a detailed "First Steps" documentation page walking through database setup, env vars, and exploring starter code.
- **Wasp**: `wasp start` immediately launches a dev server with hot reloading. `wasp start db` provisions a database.
- **create-next-app**: Generated project is immediately runnable with `npm run dev`.
- **ShipFast**: Comprehensive step-by-step documentation that IS the onboarding experience.

### What Launchblocks is missing

**2.1 No file tree summary after generation**
After generation, the user sees a flat list of created file paths. There is no structured tree view showing the directory hierarchy, no file sizes, and no descriptions of what each file is for.

> **Recommendation:** Display a tree view with annotations:
> ```
> launchblocks/
> ├── launchblocks.config.yaml        # Your configuration (editable)
> ├── LaunchBlocks_implementation.md   # Master blueprint — give this to your AI tool
> ├── specs/
> │   ├── 01-project-setup.md         # Framework & hosting setup
> │   ├── 02-database.md              # Schema, migrations, RLS policies
> │   ├── 03-authentication.md        # Login, signup, password reset
> │   ├── 04-user-management.md       # Admin panel for user accounts
> │   ├── 05-llm-gateway.md           # Provider-agnostic LLM routing
> │   ├── 06-prompt-management.md     # Template CRUD & versioning
> │   └── 07-llm-audit.md             # Usage tracking & cost dashboard
> ├── schemas/migrations/
> │   ├── 001_core_tables.sql         # Roles, permissions, profiles
> │   ├── 002_llm_tables.sql          # Prompts, audit log
> │   ├── 003_rls_policies.sql        # Row-level security
> │   └── 004_triggers.sql            # Automated behaviors
> └── CLAUDE.md                       # AI tool context file
> ```

**2.2 No interactive "what to do next" flow**
The current next-steps section is static text. Modern tools provide interactive post-generation flows.

> **Recommendation:** After generation, offer an interactive prompt:
> ```
> What would you like to do next?
>   → Open LaunchBlocks_implementation.md in your editor
>   → Run SQL migrations in Supabase
>   → View the generated specs
>   → I'm done for now
> ```

**2.3 No verification / doctor command**
There is no way to verify that the generated output is valid and complete. No `launchblocks doctor` or `launchblocks verify` command.

> **Recommendation:** Add `launchblocks doctor` that checks: config file exists and is valid, all expected spec files are present, SQL files parse correctly, MCP servers are configured, required env vars are documented.

**2.4 No sample `.env` file generation**
The tool generates a `sample-env` markdown reference but not an actual `.env.example` file that developers can copy.

> **Recommendation:** Generate a `.env.example` file with all required environment variables, commented descriptions, and placeholder values.

---

## Gap 3: Iterative & Incremental Workflows

### What competitors do

- **GitHub Spec Kit**: Supports a full Spec → Plan → Tasks → Implement loop where specs are iteratively refined before implementation begins.
- **Amazon Kiro**: Requirements → Design → Tasks with the ability to update requirements and re-derive tasks.
- **Augment Code Intent**: "Living specs" that update as AI agents implement features.
- **Projen**: Re-run `npx projen` any time the `.projenrc.ts` changes — all generated files are re-synthesized.
- **Yeoman**: File conflict resolution (diff, overwrite, skip) when re-running generators.

### What Launchblocks is missing

**3.1 No `launchblocks add <module>` command (brownfield support)**
Launchblocks only supports greenfield projects via `init`. There is no way to add a single module to an existing project, regenerate one spec, or add a new role/provider after initial setup.

> **Recommendation:** Add `launchblocks add` with subcommands:
> ```
> launchblocks add role <name>        # Add a new role to config and regenerate
> launchblocks add provider <name>    # Add a new LLM provider
> launchblocks add module <name>      # Add a specific module spec
> ```

**3.2 No `launchblocks update` / regeneration with diff**
When requirements change (new role, new provider, toggling signup approval), users must re-run `init` from scratch. There is no way to update the config and regenerate only the affected files with a diff view.

> **Recommendation:** Add `launchblocks update` that reads the existing config, applies changes, and shows a diff of what will change before writing. Similar to Projen's re-synthesis model.

**3.3 No spec versioning**
Generated specs have no version tracking. If a user regenerates, there is no history of what changed. Tessl and Augment both version specs.

> **Recommendation:** Add a `version` field to `launchblocks.config.yaml` that auto-increments on regeneration. Optionally generate a `CHANGELOG.md` inside the `launchblocks/` directory.

---

## Gap 4: Spec Quality & AI-Agent Optimization

### What competitors do

- **GitHub Spec Kit**: Breaks specs into ordered, numbered tasks with clear dependencies. AI agents follow task lists far better than narrative documents.
- **Tessl**: Couples specifications with test definitions — every capability has associated tests.
- **Wasp**: Ships `AGENTS.md` with AI-specific context and coding guidelines.
- **ShipFast**: Organized for AI-copilot readability with consistent naming and file structure.

### What Launchblocks is missing

**4.1 No task decomposition in specs**
The 7 module specs are narrative documents. They describe WHAT to build but don't break it into ordered, numbered implementation tasks. Research (Martin Fowler, GitHub) shows that AI agents perform dramatically better with ordered task lists than with narrative requirements.

> **Recommendation:** Each module spec should end with (or be restructured as) a numbered task checklist:
> ```
> ## Implementation Tasks
>
> ### Module 2: Database
> - [ ] Task 2.1: Create Supabase project and obtain credentials
> - [ ] Task 2.2: Run 001_core_tables.sql migration
> - [ ] Task 2.3: Run 002_llm_tables.sql migration
> - [ ] Task 2.4: Run 003_rls_policies.sql migration
> - [ ] Task 2.5: Run 004_triggers.sql migration
> - [ ] Task 2.6: Verify all tables via Supabase dashboard
> - [ ] Task 2.7: Test RLS policies with test users
> ```

**4.2 No test specifications**
Specs describe implementation but not verification. Tessl's key insight is that every capability should have associated test definitions.

> **Recommendation:** Add a `tests/` section to each module spec or generate a separate test plan:
> ```
> ## Acceptance Tests — Module 3: Authentication
> - Login with valid credentials → redirects to /dashboard
> - Login with invalid credentials → shows error message
> - Signup with approval required → shows /pending-approval
> - Password reset flow → email sent, new password works
> ```

**4.3 No implementation priority / dependency graph**
The 7 modules are numbered 01-07 but the specs don't explicitly state dependencies or recommended implementation order beyond numbering.

> **Recommendation:** Add an explicit dependency graph to `LaunchBlocks_implementation.md`:
> ```
> Module 1 (Project Setup) → Module 2 (Database) → Module 3 (Auth)
>                                                  ↘ Module 4 (User Mgmt)
>                              Module 5 (LLM Gateway) → Module 6 (Prompts)
>                                                      ↘ Module 7 (Audit)
> ```

**4.4 No streaming / real-time pattern specs**
The LLM Gateway spec (Module 5) mentions streaming but does not provide detailed SSE/streaming implementation patterns. Competing LLM gateways (LiteLLM, Portkey, Vercel AI SDK) all emphasize streaming as a first-class concern.

> **Recommendation:** Expand Module 5 with explicit streaming patterns: SSE endpoint structure, client-side consumption, error handling during streams, and token-by-token rendering.

---

## Gap 5: Missing Feature Modules

### What competitors include that Launchblocks doesn't

| Feature | Supastarter | Makerkit | ShipFast | Open SaaS | Launchblocks |
|---------|-------------|----------|----------|-----------|-------------|
| Auth (email/password) | Yes | Yes | Yes | Yes | **Yes** |
| RBAC / Permissions | Yes | Yes | — | — | **Yes** |
| LLM Gateway | — | — | — | — | **Yes** |
| Prompt Management | — | — | — | — | **Yes** |
| Audit Trail | — | — | — | — | **Yes** |
| **Stripe/Billing** | Yes | Yes | Yes | Yes | **No** |
| **Multi-tenancy / Teams** | Yes | Yes | — | — | **No** |
| **i18n / Localization** | Yes | Yes | — | — | **No** |
| **Email / Notifications** | Yes | Yes | Yes | Yes | **No** |
| **Landing Page / Marketing** | Yes | Yes | Yes | Yes | **No** |
| **File Upload / Storage** | Yes | Yes | — | — | **No** |
| **Cost Controls / Budgets** | — | — | — | — | **No** |

### Most impactful missing modules

**5.1 Billing / Stripe integration spec**
This is table stakes for SaaS boilerplates. Every paid competitor (Supastarter, Makerkit, ShipFast) includes Stripe integration. For an "AI-powered app" scaffolder, usage-based billing tied to LLM token consumption is the natural fit.

> **Recommendation:** Add optional Module 8: Billing — covering Stripe setup, subscription plans, usage-based metering (tied to LLM audit data), customer portal, and webhook handling.

**5.2 Cost controls and budget management**
LiteLLM's most-loved feature is spend tracking with budget caps. Portkey offers rate limiting and semantic caching. The current LLM Gateway spec has audit logging but no cost controls.

> **Recommendation:** Expand Module 5 or add Module 8b: Cost Controls — covering per-user/per-role budget caps, rate limiting, model fallback chains (expensive model → cheap model when budget is low), and cost alerts.

**5.3 Email / Notification system**
Transactional emails (welcome, password reset, approval notifications) are referenced in the auth/user-management specs but there's no dedicated email module spec.

> **Recommendation:** Add optional Module 9: Notifications — covering transactional email via Resend/Postmark, in-app notifications, and webhook-based integrations.

---

## Gap 6: Discoverability & Positioning

### Current state

Launchblocks has **zero public web presence**. Searching for "launchblocks CLI", "launchblocks AI scaffolding", or similar terms yields no results. The npm package README is the only public-facing documentation.

### What competitors do

- **create-t3-app**: Dedicated docs site (create.t3.gg), YouTube content from creator, active Discord.
- **Wasp**: Y Combinator backing, dedicated marketing site (wasp.sh), blog, Open SaaS as a viral growth tool.
- **ShipFast**: Product Hunt launches, revenue leaderboard, creator's Twitter presence.
- **GitHub Spec Kit**: GitHub blog post, Microsoft developer blog, Martin Fowler endorsement.

### What Launchblocks is missing

**6.1 Not positioned as "Spec-Driven Development"**
Launchblocks was doing SDD before the term became mainstream. The README should explicitly use this language and reference the broader movement (Thoughtworks Radar, Martin Fowler, GitHub Spec Kit).

> **Recommendation:** Update README tagline from "Spec-driven launchpad for AI-powered applications" to explicitly position within the SDD movement. Add a "Why Spec-Driven?" section referencing the industry trend.

**6.2 No `create-launchblocks` npm alias**
The `create-*` pattern is the de facto standard for npm scaffolding tools. `npx create-launchblocks` would be instantly recognizable.

**6.3 No `--help` richness**
The CLI has a basic help command but no `launchblocks list-roles`, `launchblocks list-providers`, or other discovery subcommands that teach users about the tool's capabilities.

---

## Prioritized Recommendations (Top 10)

| # | Recommendation | Category | Effort | Impact |
|---|---------------|----------|--------|--------|
| 1 | Add `--defaults` flag with meta-prompt ("Use recommended defaults?") | CLI Convenience | Low | High |
| 2 | Add task decomposition to module specs (numbered checklists) | Spec Quality | Medium | High |
| 3 | Add `--dry-run` flag | CLI Convenience | Low | High |
| 4 | Add `--config <path>` flag for regeneration from saved config | CLI Convenience | Low | High |
| 5 | Add annotated file tree summary after generation | Post-Generation | Low | High |
| 6 | Add `launchblocks add` command for brownfield/incremental use | Iterative Workflows | Medium | High |
| 7 | Add Billing/Stripe module spec (optional) | Missing Modules | Medium | Medium |
| 8 | Add acceptance test definitions to each module spec | Spec Quality | Medium | Medium |
| 9 | Add CLI flags for all interview options (non-interactive mode) | CLI Convenience | Low | Medium |
| 10 | Position explicitly as SDD; add `create-launchblocks` npm alias | Discoverability | Low | Medium |

---

## Competitive Landscape Summary

### Direct competitors (spec-driven tools)

| Tool | Approach | Strength vs Launchblocks | Weakness vs Launchblocks |
|------|----------|--------------------------|--------------------------|
| **GitHub Spec Kit** | Generic SDD toolkit | Task decomposition, iterative refinement | Generic (not domain-specific), no SQL generation |
| **Amazon Kiro** | Enterprise IDE with SDD | Integrated IDE experience, requirements→tasks | Closed ecosystem, heavyweight |
| **Tessl** | Spec registry + framework | Test-coupled specs, spec versioning | Beta, not OSS, narrower scope |
| **Augment Code Intent** | Living specs in desktop app | Real-time spec updates during implementation | macOS only, not CLI-based |

### Adjacent competitors (SaaS boilerplates with Supabase)

| Tool | Price | Strength vs Launchblocks | Weakness vs Launchblocks |
|------|-------|--------------------------|--------------------------|
| **Supastarter** | ~$299+ | Working code, billing, multi-tenancy, i18n | Opinionated, framework-locked, no LLM features |
| **Makerkit** | ~$299+ | Active maintenance, Stripe, team accounts | No LLM gateway, no spec-driven approach |
| **Open SaaS (Wasp)** | Free/OSS | Full working app, 10k stars, AI template | Different paradigm (framework vs specs) |
| **ShipFast** | $199 | Revenue-proven, comprehensive docs, community | No LLM features, no RBAC, no spec-driven |

### Launchblocks' unique advantages

1. **Only tool generating specs (not code) specifically for AI-powered apps** — no direct competitor does exactly this
2. **AI-tool agnostic** — works with Claude Code, Cursor, Codex, and Gemini
3. **Domain-specific SQL** — production-ready migrations with RLS for the LLM app use case
4. **Free, local, instant** — no accounts, no API calls, no cost
5. **LLM Gateway + Audit + Prompt Management specs** — unique combination not found in any Supabase boilerplate

---

## Sources

- [create-t3-app](https://create.t3.gg/) — CLI UX patterns, post-generation docs
- [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app) — defaults meta-prompt, CLI flags
- [Wasp](https://wasp.sh/) — AI generation, template selection, ongoing CLI relationship
- [Yeoman](https://yeoman.io/) — run loop, config storage, conflict resolution
- [Projen](https://projen.io/) — config-as-code, re-synthesis model
- [ShipFast](https://shipfa.st/) — commercial boilerplate UX, community features
- [GitHub Spec Kit](https://github.com/github/spec-kit) — SDD workflow, task decomposition
- [Amazon Kiro](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — enterprise SDD
- [Tessl](https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/) — test-coupled specs
- [Augment Code Intent](https://www.augmentcode.com/product/intent) — living specs
- [Martin Fowler on SDD Tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [Thoughtworks Radar: SDD](https://www.thoughtworks.com/radar/techniques/spec-driven-development)
- [GitHub Blog: Spec-Driven Development](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [Evil Martians: 6 Things Dev Tools Must Have in 2026](https://evilmartians.com/chronicles/six-things-developer-tools-must-have-to-earn-trust-and-adoption)
- [Supastarter](https://supastarter.dev/), [Makerkit](https://makerkit.dev/), [Open SaaS](https://opensaas.sh/)
- [LiteLLM](https://www.litellm.ai/), [Portkey AI Gateway](https://github.com/Portkey-AI/gateway)
- [Lovable](https://lovable.dev/), [V0 by Vercel](https://v0.dev/)
