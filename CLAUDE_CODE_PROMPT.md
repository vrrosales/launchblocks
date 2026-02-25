# Claude Code Prompt — Build VibeKit CLI

## What You're Building

VibeKit is an npm CLI tool that scaffolds a spec-driven project foundation for AI-powered applications. It is NOT a code template — it generates specification files, SQL migrations, and AI-tool context files that the user then feeds to their AI coding tool (Claude Code, Cursor, Codex, Gemini CLI) to implement in whatever framework they choose.

**Install and run:**
```bash
npx vibekit init
# or
npm install -g vibekit
vibekit init
```

**What the CLI produces** (inside the user's current directory):
```
vibekit/
├── vibekit.config.yaml             # Generated from interview answers
├── AI_CONTEXT.md                   # Master spec — universal, tool-agnostic
├── CLAUDE.md                       # Claude Code context (if selected)
├── .cursorrules                    # Cursor context (if selected)
├── AGENTS.md                       # Codex context (if selected)
├── GEMINI.md                       # Gemini CLI context (if selected)
│
├── specs/
│   ├── 01-project-setup.md
│   ├── 02-database.md
│   ├── 03-authentication.md
│   ├── 04-user-management.md
│   ├── 05-llm-gateway.md
│   ├── 06-prompt-management.md
│   └── 07-llm-audit.md
│
├── schemas/
│   ├── migrations/
│   │   ├── 001_roles_and_permissions.sql
│   │   ├── 002_users_and_profiles.sql
│   │   ├── 003_prompt_templates.sql
│   │   └── 004_llm_audit_log.sql
│   └── sample-env.md
│
└── references/
    ├── supabase-auth-patterns.md
    ├── vercel-deploy-checklist.md
    └── llm-pricing-table.md
```

The CLI does NOT generate application code (no React, no Python, no framework code). It generates specs and SQL. The SQL migrations are the only "real code" — everything else is markdown specifications.

## Tech Stack for the CLI Itself

- **Runtime:** Node.js (minimum v18)
- **Language:** TypeScript
- **Package manager:** npm
- **Key dependencies:**
  - `inquirer` or `prompts` — interactive CLI prompts for the configuration interview
  - `chalk` — colored terminal output
  - `fs-extra` — file system operations
  - `yaml` — YAML parsing/serialization for vibekit.config.yaml
  - `commander` or `yargs` — CLI argument parsing
  - `mustache` or `handlebars` — template rendering (to inject config values into spec files and SQL)
- **Build:** `tsup` or `esbuild` for fast compilation
- **Publish:** npm registry as `vibekit`

## CLI Commands

### `vibekit init`

The main (and initially only) command. Here's what it does step by step:

**Step 1: Welcome**
```
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   VibeKit — Spec-Driven AI App Foundation    ║
  ║                                              ║
  ║   Let's configure your project.              ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
```

**Step 2: Run the Configuration Interview**

Ask the 7 questions defined in AI_CONTEXT.md Section 3. Here's how each maps to CLI prompts:

**Q1: Roles**
```
? What roles does your application need?
  VibeKit requires an "owner" role (full access) and a "default" role (assigned to new signups).

  (1) Use defaults: super_admin, admin, user  [recommended]
  (2) Custom roles

  > 1
```

If they choose custom:
```
? Enter your roles (comma-separated, e.g. "owner, editor, viewer"):
  > owner, editor, viewer

? Which role is the owner role (highest privilege)? (Use arrow keys)
  ❯ owner
    editor
    viewer

? Which role is assigned to new signups by default? (Use arrow keys)
    owner
    editor
  ❯ viewer
```

**Q2: Permissions**

Show a matrix. For default roles, show the defaults and ask for confirmation. For custom roles, walk through each role:

```
? Configure permissions for "editor":
  (Use spacebar to toggle, enter to confirm)

  ◉ manage_users      — View user list, approve/suspend accounts
  ◉ manage_prompts    — Create/edit/delete prompt templates
  ◉ view_audit_log    — View LLM audit trail and cost data
  ◯ manage_roles      — Change user roles
  ◯ export_audit_log  — Export audit data as CSV
  ◯ manage_settings   — Modify application settings
  ◯ manage_providers  — Add/edit LLM provider configs
```

The owner role always gets all permissions automatically — skip the prompt for it and just inform the user.

**Q3: Signup Approval**
```
? Should new user signups require admin approval before accessing the app?
  ❯ Yes — new users wait for approval (recommended)
    No — new users get immediate access
```

**Q4: Admin Panel Access**

Auto-infer from Q2 (roles with at least one admin permission) and confirm:
```
? These roles will see the admin panel: super_admin, admin
  Is that correct? (Y/n)
```

**Q5: LLM Access**
```
? Which roles can use AI/LLM features in the app?
  ❯ All roles (recommended)
    Specific roles only
```

**Q6: LLM Providers**
```
? Which LLM providers will you use? (spacebar to toggle)
  ◉ OpenAI (GPT-4o, etc.)
  ◯ Anthropic (Claude, etc.)
  ◯ Google (Gemini, etc.)
```

**Q7: App Name**
```
? What is your application's name?
  > My App
```

**Q8: AI Tool (bonus question, not in the spec but needed for the CLI)**
```
? Which AI coding tool will you use to implement the project?
  (We'll generate the right context file)

  ◉ Claude Code (CLAUDE.md)
  ◯ Cursor (.cursorrules)
  ◯ Codex / OpenAI (AGENTS.md)
  ◯ Gemini CLI (GEMINI.md)
  ◯ All of the above
```

**Step 3: Generate vibekit.config.yaml**

Write the YAML config file from the interview answers.

**Step 4: Generate All Files**

Use templates to produce every file in the output structure. The templates are stored in the CLI package under `src/templates/`. Each template uses Mustache/Handlebars syntax to inject config values.

Key rendering logic:
- `AI_CONTEXT.md` — the master spec. All `[CONFIGURED: ...]` markers in the template get replaced with actual values from the config. For example, `[CONFIGURED: owner_role]` becomes `super_admin` (or whatever the user chose). The output should read as a fully resolved, concrete spec — no markers left.
- `specs/*.md` — each spec file is a detailed module specification. These also get config values injected.
- `schemas/migrations/*.sql` — actual SQL files. The roles and permissions tables get seed data from the config. The user_profiles trigger uses the configured default role and approval behavior.
- Tool-specific context files (`CLAUDE.md`, `.cursorrules`, etc.) — thin wrappers that say "read AI_CONTEXT.md and implement everything in it."
- `references/*.md` — static reference files (no config injection needed).

**Step 5: Summary**
```
  ✅ VibeKit initialized successfully!

  Created:
    vibekit/vibekit.config.yaml
    vibekit/AI_CONTEXT.md
    vibekit/CLAUDE.md
    vibekit/specs/ (7 spec files)
    vibekit/schemas/migrations/ (4 SQL files)
    vibekit/references/ (3 reference files)

  Next steps:
    1. cd vibekit
    2. Open your project in Claude Code
    3. Tell Claude: "Read AI_CONTEXT.md and implement all 7 modules using Next.js"
       (or whatever framework you prefer)
    4. Claude will read the specs and start building!

  The AI_CONTEXT.md is your master blueprint.
  The SQL files in schemas/migrations/ are ready to run in Supabase.
```

### `vibekit --help`

```
Usage: vibekit <command> [options]

Commands:
  init          Initialize a new VibeKit project with interactive configuration

Options:
  -v, --version  Show version
  -h, --help     Show help
```

### `vibekit --version`

Outputs the current package version.

## Project Structure for the CLI Itself

```
vibekit-cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md                      # npm package README
├── LICENSE
├── bin/
│   └── vibekit.ts                 # CLI entry point (shebang, commander setup)
├── src/
│   ├── index.ts                   # Main exports
│   ├── commands/
│   │   └── init.ts                # The init command logic
│   ├── interview/
│   │   ├── runner.ts              # Orchestrates the full interview flow
│   │   ├── questions/
│   │   │   ├── roles.ts           # Q1: Role definition prompts
│   │   │   ├── permissions.ts     # Q2: Permission matrix prompts
│   │   │   ├── signup.ts          # Q3: Approval behavior
│   │   │   ├── admin-access.ts    # Q4: Admin panel access
│   │   │   ├── llm-access.ts      # Q5: LLM feature access
│   │   │   ├── providers.ts       # Q6: LLM providers
│   │   │   ├── app-info.ts        # Q7: App name
│   │   │   └── ai-tool.ts         # Q8: AI tool selection
│   │   └── types.ts               # TypeScript types for interview answers
│   ├── generator/
│   │   ├── index.ts               # Orchestrates file generation
│   │   ├── config-writer.ts       # Writes vibekit.config.yaml
│   │   ├── spec-renderer.ts       # Renders spec templates with config values
│   │   ├── sql-renderer.ts        # Renders SQL migration templates
│   │   └── context-renderer.ts    # Renders AI tool context files
│   ├── templates/                  # Mustache/Handlebars template files
│   │   ├── ai-context.md.hbs      # AI_CONTEXT.md template
│   │   ├── claude-md.md.hbs       # CLAUDE.md template
│   │   ├── cursorrules.md.hbs     # .cursorrules template
│   │   ├── agents-md.md.hbs       # AGENTS.md template
│   │   ├── gemini-md.md.hbs       # GEMINI.md template
│   │   ├── specs/
│   │   │   ├── 01-project-setup.md.hbs
│   │   │   ├── 02-database.md.hbs
│   │   │   ├── 03-authentication.md.hbs
│   │   │   ├── 04-user-management.md.hbs
│   │   │   ├── 05-llm-gateway.md.hbs
│   │   │   ├── 06-prompt-management.md.hbs
│   │   │   └── 07-llm-audit.md.hbs
│   │   ├── schemas/
│   │   │   ├── 001_roles_and_permissions.sql.hbs
│   │   │   ├── 002_users_and_profiles.sql.hbs
│   │   │   ├── 003_prompt_templates.sql.hbs
│   │   │   ├── 004_llm_audit_log.sql.hbs
│   │   │   └── sample-env.md.hbs
│   │   └── references/
│   │       ├── supabase-auth-patterns.md    # Static, no templating
│   │       ├── vercel-deploy-checklist.md   # Static
│   │       └── llm-pricing-table.md         # Static
│   └── utils/
│       ├── logger.ts              # Chalk-based pretty printing
│       ├── validation.ts          # Input validation helpers
│       └── slug.ts                # String → slug conversion
└── test/
    ├── interview.test.ts
    ├── generator.test.ts
    └── fixtures/                  # Sample configs for testing
        ├── default-config.yaml
        └── custom-config.yaml
```

## Template Rendering Rules

When rendering templates, follow these rules:

1. **AI_CONTEXT.md** — This is the big one. The template should be the full AI_CONTEXT.md master spec with `[CONFIGURED: ...]` markers replaced by Handlebars variables. For example:
   - `[CONFIGURED: owner_role]` → `{{owner_role}}` in template → resolved to actual value
   - `[CONFIGURED: default_role]` → `{{default_role}}`
   - `[CONFIGURED: require_approval]` → used for conditional sections (`{{#if require_approval}}...{{/if}}`)
   - `[CONFIGURED: admin_access.roles]` → `{{admin_access_roles}}` (comma-separated list)
   - `[CONFIGURED: roles]` → rendered as a table or list from the roles array
   - Permissions → rendered as actual role-permission mappings

2. **SQL migrations** — These are the most critical templates. They must produce valid, runnable SQL. Example for `001_roles_and_permissions.sql.hbs`:
   ```sql
   -- Migration: 001_roles_and_permissions
   -- Generated by VibeKit

   CREATE TABLE public.roles (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL UNIQUE,
     display_name text NOT NULL,
     description text,
     is_owner_role boolean NOT NULL DEFAULT false,
     is_default_role boolean NOT NULL DEFAULT false,
     is_system boolean NOT NULL DEFAULT false,
     sort_order integer NOT NULL DEFAULT 0,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   );

   ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

   -- All authenticated users can read roles
   CREATE POLICY "roles_select_authenticated" ON public.roles
     FOR SELECT TO authenticated USING (true);

   -- Only owner role can modify roles
   CREATE POLICY "roles_modify_owner" ON public.roles
     FOR ALL TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.user_profiles
         WHERE user_profiles.id = auth.uid()
         AND user_profiles.role = '{{owner_role}}'
       )
     );

   CREATE TABLE public.role_permissions (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
     permission text NOT NULL CHECK (permission IN (
       'manage_users', 'manage_roles', 'manage_prompts',
       'view_audit_log', 'export_audit_log', 'manage_settings', 'manage_providers'
     )),
     created_at timestamptz NOT NULL DEFAULT now(),
     UNIQUE(role_id, permission)
   );

   ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

   -- Seed roles
   {{#each roles}}
   INSERT INTO public.roles (name, display_name, is_owner_role, is_default_role, is_system, sort_order)
   VALUES ('{{this.name}}', '{{this.display_name}}', {{this.is_owner_role}}, {{this.is_default_role}}, true, {{@index}});
   {{/each}}

   -- Seed permissions
   {{#each permissions_flat}}
   INSERT INTO public.role_permissions (role_id, permission)
   VALUES (
     (SELECT id FROM public.roles WHERE name = '{{this.role}}'),
     '{{this.permission}}'
   );
   {{/each}}

   -- Helper function: has_permission
   CREATE OR REPLACE FUNCTION public.has_permission(check_user_id uuid, check_permission text)
   RETURNS boolean
   LANGUAGE sql
   SECURITY DEFINER
   STABLE
   AS $$
     SELECT EXISTS (
       SELECT 1
       FROM public.user_profiles up
       JOIN public.roles r ON r.name = up.role
       JOIN public.role_permissions rp ON rp.role_id = r.id
       WHERE up.id = check_user_id
       AND rp.permission = check_permission
     );
   $$;
   ```

3. **Spec files** — Each spec file expands on its corresponding section in AI_CONTEXT.md with more detail, edge cases, and examples. Inject config values where relevant (role names in examples, permission names in access rules).

4. **Tool-specific context files** — These are thin. Example `CLAUDE.md`:
   ```markdown
   # CLAUDE.md

   Read `AI_CONTEXT.md` in this directory. It is the complete specification for this project.

   Implement all 7 modules in the order specified (Module 1 through Module 7).
   Use the SQL files in `schemas/migrations/` directly — they are ready to run in Supabase.
   Refer to `specs/` for detailed module specifications beyond what AI_CONTEXT.md covers.
   Refer to `references/` for implementation patterns and pricing data.
   The `vibekit.config.yaml` file contains the project configuration — do not modify it.
   ```

## package.json Essentials

```json
{
  "name": "vibekit",
  "version": "0.1.0",
  "description": "Spec-driven launchpad for AI-powered applications",
  "bin": {
    "vibekit": "./dist/bin/vibekit.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": ["ai", "llm", "scaffold", "cli", "supabase", "vercel", "vibe-coding"],
  "engines": {
    "node": ">=18"
  }
}
```

Critical: The `bin` field is what makes `npx vibekit init` work. The compiled entry point must have `#!/usr/bin/env node` at the top.

## Content for the Template Files

This is the most labor-intensive part. You need to write the actual content for every template. Here's where to source it:

- **AI_CONTEXT.md template** — I will provide this file. It's the master spec. Convert all `[CONFIGURED: ...]` markers to Handlebars variables. Add conditionals for `require_approval` sections.
- **Spec files** — Expand each AI_CONTEXT.md module section into a standalone, detailed spec. Add edge cases, error scenarios, more detailed UI descriptions, and implementation hints.
- **SQL migrations** — Write complete, valid Supabase SQL for all 8 tables, RLS policies, triggers, functions, indexes, and seed data. Every `[CONFIGURED: ...]` becomes a Handlebars variable.
- **Reference files** — Write supabase auth patterns, Vercel deployment checklist, and LLM pricing table as static markdown.
- **Tool context files** — Short wrapper files for each AI tool.

## Testing the CLI

After building, verify:

1. `npx vibekit init` with all defaults → produces correct file structure with default roles (super_admin, admin, user)
2. `npx vibekit init` with custom roles (e.g., owner, editor, viewer) → all files reflect custom roles, SQL seeds correct data
3. `npx vibekit init` with require_approval = false → pending-approval screen omitted from specs, SQL trigger sets status to 'approved'
4. All generated SQL files are valid (run them against a fresh Supabase project)
5. AI_CONTEXT.md has no remaining `[CONFIGURED: ...]` markers — everything is resolved
6. The generated CLAUDE.md / .cursorrules / etc. are correct for the selected tool

## Important Principles

1. **The CLI produces specs, not app code.** Never generate React components, API routes, or framework-specific code. Only markdown specs and SQL.
2. **Every generated file must be self-consistent.** If the user chose roles "owner, editor, viewer", every spec file, SQL file, and the AI_CONTEXT.md must consistently use those role names.
3. **SQL must be runnable as-is.** A user should be able to copy the migration files into Supabase's SQL editor and run them without modification.
4. **The AI_CONTEXT.md must be fully resolved.** No template markers, no `[CONFIGURED: ...]`, no `{{variables}}` in the output. It reads as a concrete, specific specification for this user's project.
5. **Keep the CLI simple and fast.** No network calls, no API keys, no accounts. It's a local scaffolding tool.

## Start Here

1. Initialize the npm project with TypeScript
2. Set up the CLI entry point with commander
3. Build the interview flow with prompts/inquirer
4. Build the config writer (interview answers → YAML)
5. Build the template renderer (config + templates → output files)
6. Write all template files (this is the bulk of the work)
7. Test with default and custom configurations
8. Publish to npm

The attached AI_CONTEXT.md file in this project is the source material for the master spec template. Convert it to a Handlebars template where `[CONFIGURED: ...]` markers become template variables.
