# LaunchBlocks_implementation.md — VibeKit Master Specification

> **What this file is:** The single source of truth for any AI coding tool implementing a VibeKit project. Every tool-specific context file (CLAUDE.md, .cursorrules, AGENTS.md, GEMINI.md) points here.
>
> **How to use it:** Read this file in full before generating any code. **Before implementing anything, run the Pre-Implementation Configuration interview (Section 3) to collect the user's choices about roles, permissions, and project behavior.** Those answers feed into every module. This file defines the architecture, modules, data model, API contracts, and UI requirements. You choose the language and framework — this file tells you *what* to build.

---

## 1. Project Overview

VibeKit is a spec-driven launchpad for AI-powered applications. It provides seven foundational modules that every AI app needs — auth, user management, an LLM gateway, prompt management, and an LLM audit trail — so the developer can skip boilerplate and focus on their unique product logic.

**Your job as an AI coding tool:** Implement these seven modules in whatever stack the user has chosen, following the contracts and behaviors defined below exactly.

### Technology Constraints (Non-Negotiable)

| Layer | Service | Why |
|---|---|---|
| Hosting | **Vercel** | Serverless functions, edge network, git-based deploys |
| Database | **Supabase (PostgreSQL)** | Managed Postgres with Row Level Security, realtime, and built-in auth |
| Authentication | **Supabase Auth** | Email/password, OAuth, magic links — no custom auth to maintain |
| LLM Providers | **Any** (OpenAI, Anthropic, Google, etc.) | Abstracted behind the LLM Gateway |

### What You Choose

The framework (Next.js, SvelteKit, Nuxt, Remix, Rails, Django, FastAPI, etc.), component library, styling approach, and state management are entirely up to the user and implementing tool. The specs below describe *what* each screen does and *what* each endpoint accepts/returns — not how to wire it in a specific framework.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend App                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  Auth UI │ │ Admin UI │ │   Your Product UI    │ │
│  └────┬─────┘ └────┬─────┘ └──────────┬───────────┘ │
│       │             │                  │             │
│       ▼             ▼                  ▼             │
│  ┌─────────────────────────────────────────────────┐ │
│  │              API / Server Layer                  │ │
│  │  ┌────────────────────────────────────────────┐ │ │
│  │  │           LLM Gateway (Module 5)           │ │ │
│  │  │  Every LLM call in the app routes through  │ │ │
│  │  │  this single layer. No exceptions.         │ │ │
│  │  └──────────┬────────────────┬────────────────┘ │ │
│  └─────────────┼────────────────┼──────────────────┘ │
└────────────────┼────────────────┼────────────────────┘
                 │                │
    ┌────────────▼──┐    ┌───────▼────────┐
    │   Supabase    │    │  LLM Providers │
    │  (DB + Auth)  │    │  (OpenAI, etc) │
    └───────────────┘    └────────────────┘
```

**Critical rule:** ALL LLM calls — whether from your product features, admin tools, or any other part of the app — MUST route through the LLM Gateway. This is what makes prompt management and audit logging work. Never call an LLM provider SDK directly from feature code.

---

## 3. Pre-Implementation Configuration

**STOP. Before writing any code, you MUST run this configuration interview with the user.** The answers define roles, permissions, signup behavior, and access rules that propagate through every module. Do not assume defaults — ask the questions, record the answers, and use them everywhere the spec says `[CONFIGURED: ...]`.

Store the user's answers in a `vibekit.config.yaml` (or equivalent) file at the project root. This file is the single source of truth for all project-specific configuration and is referenced by the database seed script, route middleware, and admin UI.

### 3.1 Configuration Interview

Ask the user the following questions in order. Each question includes a default answer in brackets. If the user accepts the default, use it. If they customize, validate their answer against the constraints listed.

---

**Q1: What roles does your application need?**

> VibeKit requires at minimum two structural roles: one "owner" role with full access (including the ability to manage other roles), and one "default" role assigned to new signups. You can define as many roles in between as you need.

Default: `super_admin`, `admin`, `user`

Constraints:
- Minimum 2 roles, maximum 10 roles.
- Each role needs a `name` (lowercase, underscores, no spaces — this is the database value) and a `display_name` (human-readable, shown in UI).
- Exactly ONE role must be marked as the `owner_role` (highest privilege, cannot be removed).
- Exactly ONE role must be marked as the `default_role` (assigned to new signups).

Capture as:
```yaml
roles:
  - name: super_admin
    display_name: "Super Admin"
    is_owner_role: true
    is_default_role: false
  - name: admin
    display_name: "Admin"
    is_owner_role: false
    is_default_role: false
  - name: user
    display_name: "User"
    is_owner_role: false
    is_default_role: true
```

Example custom answer: "I need: owner, editor, viewer" → 3 roles where `owner` is owner_role and `viewer` is default_role.

---

**Q2: For each role, what permissions should it have?**

> Permissions control access to the admin panel and its sub-features. Every role automatically gets access to the core application — these permissions are only about the *admin-side* features.

Present the user with this permission matrix and ask them to fill it in for each role:

| Permission | Description | Default for `super_admin` | Default for `admin` | Default for `user` |
|---|---|---|---|---|
| `manage_users` | View user list, approve/suspend accounts | ✅ | ✅ | ❌ |
| `manage_roles` | Change user roles (assign/revoke) | ✅ | ❌ | ❌ |
| `manage_prompts` | Create/edit/delete prompt templates | ✅ | ✅ | ❌ |
| `view_audit_log` | View LLM audit trail and cost data | ✅ | ✅ | ❌ |
| `export_audit_log` | Export audit data as CSV | ✅ | ❌ | ❌ |
| `manage_settings` | Modify application settings | ✅ | ❌ | ❌ |
| `manage_providers` | Add/edit LLM provider configs and pricing | ✅ | ❌ | ❌ |

Constraints:
- The `owner_role` MUST have ALL permissions (non-negotiable).
- `manage_roles` should be restricted to as few roles as possible (it's the most sensitive permission).
- At least one role must have `manage_users` (otherwise no one can approve signups).

Capture as:
```yaml
permissions:
  super_admin: [manage_users, manage_roles, manage_prompts, view_audit_log, export_audit_log, manage_settings, manage_providers]
  admin: [manage_users, manage_prompts, view_audit_log]
  user: []
```

---

**Q3: Should new user signups require approval?**

> When approval is required, new users see a "pending approval" screen after signing up and cannot use the app until an admin approves them. When approval is NOT required, new users are immediately active after signup (or email confirmation, if enabled).

Default: `yes` (require approval)

Capture as:
```yaml
signup:
  require_approval: true
```

If the user says no, the database trigger should set `status: 'approved'` instead of `status: 'pending'` for new signups, and the `/pending-approval` screen can be omitted.

---

**Q4: Which roles can access the admin panel?**

> The admin panel contains user management, prompt management, and LLM audit screens. This question determines which roles see the admin navigation link at all. Fine-grained access within admin is controlled by the permissions in Q2.

Default: roles with at least one admin permission from Q2 (i.e., `super_admin` and `admin`)

Constraints:
- Must include the `owner_role`.
- Should logically match the permissions from Q2 — a role with zero admin permissions has no reason to access the admin panel.

Capture as:
```yaml
admin_access:
  roles: [super_admin, admin]
```

---

**Q5: Which roles can make LLM calls through the gateway?**

> This controls who can trigger LLM features in your application. Some apps want all users to access AI features; others restrict it to certain tiers.

Default: all roles

Capture as:
```yaml
llm_access:
  roles: [super_admin, admin, user]  # or "all" as shorthand
```

---

**Q6: What LLM providers will you use?**

> VibeKit supports multiple providers through the gateway. Select the ones you plan to use — you can add more later.

Default: `openai`

Options: `openai`, `anthropic`, `google`, `other` (custom)

Capture as:
```yaml
llm_providers:
  - openai
  - anthropic
```

---

**Q7: What is the name of your application?**

> Used in page titles, the login screen, email templates, and metadata.

Default: `"My App"`

Capture as:
```yaml
app:
  name: "My App"
```

---

### 3.2 Configuration File Schema

The complete `vibekit.config.yaml` after the interview:

```yaml
# vibekit.config.yaml — Generated by pre-implementation interview
# This file drives role definitions, permissions, and access rules across all modules.

app:
  name: "My App"

roles:
  - name: super_admin
    display_name: "Super Admin"
    is_owner_role: true
    is_default_role: false
  - name: admin
    display_name: "Admin"
    is_owner_role: false
    is_default_role: false
  - name: user
    display_name: "User"
    is_owner_role: false
    is_default_role: true

permissions:
  super_admin: [manage_users, manage_roles, manage_prompts, view_audit_log, export_audit_log, manage_settings, manage_providers]
  admin: [manage_users, manage_prompts, view_audit_log]
  user: []

signup:
  require_approval: true

admin_access:
  roles: [super_admin, admin]

llm_access:
  roles: [super_admin, admin, user]

llm_providers:
  - openai
```

### 3.3 How Configuration Feeds Into Modules

Every module in this spec references the user's configuration. Here's where each answer is consumed:

| Config Key | Used In |
|---|---|
| `roles` | Module 2 (database `roles` table + seed data), Module 4 (role dropdown in admin UI), route middleware |
| `permissions` | Module 2 (database `role_permissions` table + seed data), all admin API endpoints (authorization checks), admin UI (show/hide features) |
| `signup.require_approval` | Module 3 (post-signup flow: pending screen vs direct access), Module 2 (database trigger: `pending` vs `approved` default) |
| `admin_access.roles` | Module 3 (route protection middleware), Module 6/7 (admin UI visibility) |
| `llm_access.roles` | Module 5 (gateway authorization check before processing a call) |
| `llm_providers` | Module 1 (environment variables to include), Module 2 (seed `llm_provider_config` table) |
| `app.name` | Module 1 (page title, metadata), Module 3 (login/signup screen branding) |

### 3.4 The `[CONFIGURED: ...]` Convention

Throughout this spec, you will see references like:

- `[CONFIGURED: owner_role]` — means "use the role name that has `is_owner_role: true` in the config"
- `[CONFIGURED: default_role]` — means "use the role name that has `is_default_role: true`"
- `[CONFIGURED: admin_access.roles]` — means "use the list of roles from `admin_access.roles`"
- `[CONFIGURED: roles]` — means "use all role names from the `roles` list"
- `[CONFIGURED: require_approval]` — means "check `signup.require_approval`"

When you see these markers, substitute the actual values from the user's `vibekit.config.yaml`. If the user accepted all defaults, these resolve to the familiar super_admin/admin/user pattern. If they customized, your implementation must reflect their choices.

---

## 4. Module Dependency Graph

```
Module 1: Project Setup & Hosting
  └── Module 2: Database
       └── Module 3: Authentication
            └── Module 4: User Management (Admin)
                 └── Module 5: LLM Gateway
                      ├── Module 6: Prompt Management
                      └── Module 7: LLM Audit Trail
```

**Implement in this order.** Each module builds on the one before it. Modules 6 and 7 are siblings that both depend on 5.

---

## 5. Shared Conventions

Before diving into each module, here are conventions that apply across the entire project.

### 5.1 Environment Variables

All secrets and configuration live in environment variables. Never hardcode API keys, database URLs, or service credentials. See `schemas/sample-env.md` for the full list. At minimum:

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM Providers (add as needed)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# App
APP_URL=
APP_ENV=development|staging|production
```

### 5.2 User Roles

Roles are **defined by the user during the Pre-Implementation Configuration interview (Section 3)** and stored in the `roles` database table. Do not hardcode role names anywhere in the application — always query the `roles` table or reference `vibekit.config.yaml`.

**Structural guarantees (always true regardless of configuration):**

- There is exactly ONE **owner role** (`[CONFIGURED: owner_role]`). This role has all permissions, cannot be deleted, and is assigned to the first user who signs up.
- There is exactly ONE **default role** (`[CONFIGURED: default_role]`). This role is assigned to all new signups.
- Permissions are stored in the `role_permissions` table, not inferred from role names.
- The admin panel is visible only to roles listed in `[CONFIGURED: admin_access.roles]`.

**Default configuration (if the user accepts defaults):**

| Role | Display Name | Owner? | Default? | Admin Access? |
|---|---|---|---|---|
| `super_admin` | Super Admin | Yes | No | Yes |
| `admin` | Admin | No | No | Yes |
| `user` | User | No | Yes | No |

The first user to sign up is automatically assigned `[CONFIGURED: owner_role]` with `status: 'approved'`. All subsequent users are assigned `[CONFIGURED: default_role]`. If `[CONFIGURED: require_approval]` is true, they get `status: 'pending'`; otherwise `status: 'approved'`.

### 5.3 Row Level Security (RLS)

Every table in the database MUST have RLS enabled with explicit policies. The SQL migration files in `schemas/migrations/` define these policies. When implementing, ensure your Supabase client uses the `anon` key for client-side operations (which respects RLS) and the `service_role` key only for server-side admin operations.

### 5.4 API Response Shape

All API endpoints should return responses in a consistent shape:

**Success:**
```json
{
  "data": { ... },
  "error": null
}
```

**Error:**
```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

**Paginated:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 142,
    "total_pages": 6
  },
  "error": null
}
```

### 5.5 Timestamp Convention

All timestamps are stored as `timestamptz` in PostgreSQL and returned as ISO 8601 strings (e.g., `2025-01-15T09:30:00Z`). All tables include `created_at` and `updated_at` columns with automatic defaults.

### 5.6 Soft Deletes

Tables that support deletion use a `deleted_at timestamptz` column (null when active). RLS policies should filter out soft-deleted rows by default. Hard deletes are only performed by explicit admin action or scheduled cleanup.

---

## 6. Module Specifications

### Module 1: Project Setup & Hosting

**Purpose:** Get the project deployed to Vercel with proper environment configuration and CI/CD.

**What to implement:**

1. **Project scaffolding** — Initialize the project in the user's chosen framework with a clean directory structure.

2. **Vercel configuration** — Create a `vercel.json` (if needed for the chosen framework) with:
   - Build settings appropriate to the framework
   - Environment variable references (not values)
   - Redirect/rewrite rules for SPA routing if applicable

3. **Environment management** — Create a `.env.example` file listing every required variable with placeholder values and comments explaining each one. Ensure `.env` is in `.gitignore`.

4. **Health check endpoint** — Implement a `GET /api/health` endpoint that returns:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-15T09:30:00Z",
     "version": "1.0.0",
     "services": {
       "database": "connected",
       "auth": "connected"
     }
   }
   ```
   This endpoint should actually ping Supabase to verify connectivity.

5. **Deployment verification** — After deploying, the health check should pass. If it doesn't, something is misconfigured.

**Reference:** `specs/01-project-setup.md`, `references/vercel-deploy-checklist.md`

---

### Module 2: Database

**Purpose:** Set up the Supabase database schema with all tables, relationships, indexes, and RLS policies needed by every other module.

**Schema overview (8 tables):**

```
roles                  – Application roles defined during configuration
role_permissions       – Permission grants per role
user_profiles          – Extended user data beyond Supabase auth.users
prompt_templates       – Managed prompt templates with versioning
prompt_template_versions – Immutable version history for templates
llm_audit_log          – Every LLM call logged with full detail
llm_provider_config    – Provider/model configuration and pricing
app_settings           – Key-value store for application settings
```

**Table: `roles`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL, UNIQUE | Lowercase identifier (e.g., "super_admin", "editor") |
| display_name | text | NOT NULL | Human-readable label for UI |
| description | text | | What this role is for |
| is_owner_role | boolean | NOT NULL, DEFAULT false | Exactly one role has this set to true |
| is_default_role | boolean | NOT NULL, DEFAULT false | Exactly one role has this set to true — assigned to new signups |
| is_system | boolean | NOT NULL, DEFAULT false | System roles cannot be deleted via the UI |
| sort_order | integer | NOT NULL, DEFAULT 0 | Controls display order in dropdowns and tables |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**Constraints:**
- CHECK: exactly one row has `is_owner_role = true` (enforce via application logic or trigger — Postgres can't easily enforce single-row uniqueness on a boolean).
- CHECK: exactly one row has `is_default_role = true`.

**RLS policies for `roles`:**
- All authenticated users can read roles (needed for UI display).
- Only `[CONFIGURED: owner_role]` can insert, update, or delete roles.
- Roles where `is_system = true` cannot be deleted.

**Seed data:** Populated from `vibekit.config.yaml` during the database migration. The initial migration must insert all roles defined in the config.

---

**Table: `role_permissions`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| role_id | uuid | NOT NULL, REFERENCES roles(id) ON DELETE CASCADE | |
| permission | text | NOT NULL, CHECK (permission IN ('manage_users', 'manage_roles', 'manage_prompts', 'view_audit_log', 'export_audit_log', 'manage_settings', 'manage_providers')) | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**Constraints:** UNIQUE(role_id, permission). No duplicate grants.

**RLS policies for `role_permissions`:**
- All authenticated users can read (needed for authorization checks).
- Only `[CONFIGURED: owner_role]` can insert or delete permission grants.

**Seed data:** Populated from `vibekit.config.yaml` `permissions` block during migration.

**Authorization helper:** Implement a database function or application utility:

```
has_permission(user_id, permission_name) → boolean
```

This function: looks up the user's role from `user_profiles`, then checks if that role has the given permission in `role_permissions`. All admin API endpoints use this function instead of hardcoding role names.

---

**Table: `user_profiles`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, references auth.users(id) ON DELETE CASCADE | Matches Supabase auth user ID |
| email | text | NOT NULL | Copied from auth.users for query convenience |
| full_name | text | | Display name |
| role | text | NOT NULL, DEFAULT [CONFIGURED: default_role], REFERENCES roles(name) | Foreign key to roles.name — validated against the roles table |
| status | text | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'approved', 'suspended')) | Account status |
| approved_by | uuid | REFERENCES user_profiles(id) | Who approved this user |
| approved_at | timestamptz | | When they were approved |
| last_sign_in_at | timestamptz | | Last login timestamp |
| metadata | jsonb | DEFAULT '{}' | Flexible additional data |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |
| deleted_at | timestamptz | | Soft delete |

**RLS policies for `user_profiles`:**
- Users can read their own profile.
- Users with `manage_users` permission can read all profiles.
- Users can update their own `full_name` and `metadata`.
- Only users with `manage_roles` permission can update `role`.
- Users with `manage_users` permission can update `status`, `approved_by`, `approved_at`.

**Table: `prompt_templates`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL, UNIQUE | Human-readable template name |
| slug | text | NOT NULL, UNIQUE | URL-safe identifier, used in code to reference the template |
| description | text | | What this template is for |
| system_prompt | text | | System message content (supports variables) |
| user_prompt | text | NOT NULL | User message content (supports variables) |
| variables | jsonb | NOT NULL, DEFAULT '[]' | Array of `{ "name": "var_name", "type": "string", "description": "...", "required": true }` |
| model_config | jsonb | NOT NULL, DEFAULT '{}' | Default model settings: `{ "provider": "openai", "model": "gpt-4o", "temperature": 0.7, "max_tokens": 1000 }` |
| is_active | boolean | NOT NULL, DEFAULT true | Soft toggle for templates |
| current_version | integer | NOT NULL, DEFAULT 1 | Tracks the latest version number |
| feature_tag | text | | Groups templates by product feature (e.g., "onboarding", "search") |
| created_by | uuid | REFERENCES user_profiles(id) | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |
| deleted_at | timestamptz | | |

**Variable syntax in prompts:** Use double curly braces: `{{variable_name}}`. Example:
```
Summarize the following {{content_type}} in {{language}}:

{{content}}
```

**RLS policies for `prompt_templates`:**
- Users with `manage_prompts` permission can perform all CRUD operations.
- Users without `manage_prompts` permission cannot access this table directly (they interact with templates through the LLM Gateway).

**Table: `prompt_template_versions`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| template_id | uuid | NOT NULL, REFERENCES prompt_templates(id) ON DELETE CASCADE | |
| version | integer | NOT NULL | Version number (1, 2, 3...) |
| system_prompt | text | | Snapshot of system prompt at this version |
| user_prompt | text | NOT NULL | Snapshot of user prompt at this version |
| variables | jsonb | NOT NULL, DEFAULT '[]' | Snapshot of variables definition |
| model_config | jsonb | NOT NULL, DEFAULT '{}' | Snapshot of model config |
| change_note | text | | What changed in this version |
| created_by | uuid | REFERENCES user_profiles(id) | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**Constraints:** UNIQUE(template_id, version). This table is append-only — rows are never updated or deleted.

**RLS policies:** Same as `prompt_templates` (`manage_prompts` permission required).

**Table: `llm_audit_log`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| user_id | uuid | REFERENCES user_profiles(id) | Who triggered this call (null for system calls) |
| template_id | uuid | REFERENCES prompt_templates(id) | Which template was used (null for ad-hoc calls) |
| template_version | integer | | Version of template used at call time |
| provider | text | NOT NULL | e.g., "openai", "anthropic", "google" |
| model | text | NOT NULL | e.g., "gpt-4o", "claude-sonnet-4-5-20250514" |
| system_prompt | text | | Fully resolved system prompt sent to provider |
| user_prompt | text | NOT NULL | Fully resolved user prompt sent to provider |
| response | text | | Raw response text from provider |
| status | text | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'success', 'error', 'timeout')) | Call outcome |
| error_message | text | | Error details if status is 'error' or 'timeout' |
| input_tokens | integer | | Token count for input |
| output_tokens | integer | | Token count for output |
| total_tokens | integer | | input_tokens + output_tokens |
| input_cost_usd | numeric(10,6) | | Cost of input tokens in USD |
| output_cost_usd | numeric(10,6) | | Cost of output tokens in USD |
| total_cost_usd | numeric(10,6) | | Total cost in USD |
| latency_ms | integer | | Time from request sent to response received |
| metadata | jsonb | DEFAULT '{}' | Additional context (feature tag, request ID, etc.) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS policies for `llm_audit_log`:**
- Users can read their own audit log entries.
- Users with `view_audit_log` permission can read all entries.
- Only the server (service_role) can insert entries — this happens inside the LLM Gateway.
- No one can update or delete audit log entries (append-only).

**Indexes on `llm_audit_log`:**
- `idx_audit_user_id` on (user_id)
- `idx_audit_template_id` on (template_id)
- `idx_audit_created_at` on (created_at DESC)
- `idx_audit_provider_model` on (provider, model)
- `idx_audit_status` on (status)

**Table: `llm_provider_config`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| provider | text | NOT NULL | e.g., "openai", "anthropic" |
| model | text | NOT NULL | e.g., "gpt-4o", "claude-sonnet-4-5-20250514" |
| display_name | text | NOT NULL | Human-friendly name for UI |
| input_price_per_1k | numeric(10,6) | NOT NULL | USD per 1,000 input tokens |
| output_price_per_1k | numeric(10,6) | NOT NULL | USD per 1,000 output tokens |
| is_active | boolean | NOT NULL, DEFAULT true | Available for use |
| max_tokens_limit | integer | | Hard limit for this model |
| supports_system_prompt | boolean | NOT NULL, DEFAULT true | Some models don't support system prompts |
| config | jsonb | DEFAULT '{}' | Provider-specific config (API version, etc.) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**Constraints:** UNIQUE(provider, model).

**RLS policies:** Users with `manage_providers` permission for all operations. Server (service_role) can read for gateway routing.

**Table: `app_settings`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| key | text | PK | Setting identifier |
| value | jsonb | NOT NULL | Setting value |
| description | text | | What this setting controls |
| updated_by | uuid | REFERENCES user_profiles(id) | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS policies:** Users with `manage_settings` permission for all operations. Server can read.

**Database functions and triggers:**
- A trigger on `user_profiles` to auto-update `updated_at` on any row change.
- A trigger on `prompt_templates` to auto-update `updated_at` on any row change.
- A trigger on `roles` to auto-update `updated_at` on any row change.
- A function to auto-create a `user_profiles` row when a new `auth.users` row is created (via Supabase auth trigger). This function must:
  - Check if this is the FIRST user profile: if yes, assign `[CONFIGURED: owner_role]` and `status: 'approved'`.
  - Otherwise, assign `[CONFIGURED: default_role]`. If `[CONFIGURED: require_approval]` is true, set `status: 'pending'`; otherwise set `status: 'approved'`.
- A function that creates a `prompt_template_versions` entry whenever a `prompt_templates` row is updated (capturing the previous state).

**Reference:** `specs/02-database.md`, `schemas/migrations/`

---

### Module 3: Authentication

**Purpose:** Handle user registration, login, logout, password reset, and session management using Supabase Auth. Protect routes based on authentication state and user role.

**Supported auth methods:**
- Email + password (required)
- OAuth providers: Google, GitHub (optional, configurable)
- Magic link (optional, configurable)

**Screens to implement:**

**3.1 Sign Up (`/signup`)**
- Fields: email, password, confirm password, full name
- Validation: email format, password min 8 characters, passwords match
- On submit: call Supabase `auth.signUp()`, which triggers the database function to create a `user_profiles` row with role `[CONFIGURED: default_role]`
- **If `[CONFIGURED: require_approval]` is true:**
  - Profile is created with `status: 'pending'`
  - After signup: show message: "Your account has been created. An administrator will review and approve your access."
  - Redirect: to a `/pending-approval` page (not the main app)
- **If `[CONFIGURED: require_approval]` is false:**
  - Profile is created with `status: 'approved'`
  - After signup: redirect directly to the app's main page
- If email confirmation is enabled in Supabase, show: "Check your email to confirm your address."

**3.2 Login (`/login`)**
- Fields: email, password
- Validation: both fields required
- On submit: call Supabase `auth.signInWithPassword()`
- Post-login logic:
  1. Fetch the user's `user_profiles` row.
  2. If `[CONFIGURED: require_approval]` is true AND `status` is `pending` → redirect to `/pending-approval`, do NOT grant app access.
  3. If `status` is `suspended` → show error: "Your account has been suspended. Contact an administrator."
  4. If `status` is `approved` → redirect to the app's main page.
- OAuth buttons (if configured): "Continue with Google", "Continue with GitHub"

**3.3 Pending Approval (`/pending-approval`)** — *Only implement if `[CONFIGURED: require_approval]` is true.*
- Simple status page shown to authenticated users whose status is `pending`.
- Message: "Your account is awaiting administrator approval. You'll receive an email once approved."
- Include a logout button.
- This page should poll or use Supabase realtime to check if status changes.

**3.4 Password Reset (`/reset-password`)**
- Step 1: Enter email → call Supabase `auth.resetPasswordForEmail()`
- Step 2: User clicks email link → lands on `/update-password`
- Step 3: Enter new password + confirm → call Supabase `auth.updateUser({ password })`

**3.5 Logout**
- Call Supabase `auth.signOut()`
- Clear any client-side session state.
- Redirect to `/login`.

**Route protection middleware:**

Implement middleware or route guards that run on every navigation:

```
IF user is not authenticated:
  → redirect to /login (except for /signup, /login, /reset-password)

IF [CONFIGURED: require_approval] is true:
  IF user is authenticated but status is 'pending':
    → redirect to /pending-approval (except for /pending-approval and /logout)

IF user is authenticated but status is 'suspended':
  → sign them out and redirect to /login with error message

IF route is under /admin AND user's role is NOT in [CONFIGURED: admin_access.roles]:
  → redirect to main app page (or show 403)

IF route requires a specific permission (e.g., /admin/prompts requires manage_prompts):
  → check has_permission(user_id, required_permission)
  → if false, redirect to /admin (or show 403)
```

**Session management:**
- Use Supabase's built-in session handling (JWT refresh tokens).
- On each authenticated request, verify the JWT is still valid.
- Update `user_profiles.last_sign_in_at` on successful login.

**First user auto-approval:**
- The database trigger that creates a `user_profiles` row should check: if this is the FIRST user profile ever created, set `role` to `[CONFIGURED: owner_role]` and `status` to `approved`. All subsequent users get `role: [CONFIGURED: default_role]` and `status` based on `[CONFIGURED: require_approval]`.

**Reference:** `specs/03-authentication.md`, `references/supabase-auth-patterns.md`

---

### Module 4: User Management (Admin)

**Purpose:** Give admins a screen to approve new users, assign roles, suspend accounts, and monitor user activity. Accessible only to users with the `manage_users` permission.

**Route:** `/admin/users`

**Screen: User List**

A paginated, filterable table of all users.

**Columns:**
| Column | Source | Sortable | Filterable |
|---|---|---|---|
| Name | user_profiles.full_name | Yes | Search |
| Email | user_profiles.email | Yes | Search |
| Role | user_profiles.role | Yes | Dropdown: populated dynamically from `roles` table |
| Status | user_profiles.status | Yes | Dropdown: all, pending, approved, suspended |
| Signed Up | user_profiles.created_at | Yes | Date range |
| Last Active | user_profiles.last_sign_in_at | Yes | |
| Approved By | user_profiles.approved_by → full_name | No | |

**Default view:** Sort by `created_at DESC`, filter by `status = pending` (so admins see new signups first).

**Batch actions (when rows are selected):**
- Approve selected
- Suspend selected

**Per-row actions (dropdown or buttons):**

| Action | Available When | What It Does |
|---|---|---|
| Approve | status = pending | Set status to `approved`, record `approved_by` and `approved_at` |
| Suspend | status = approved | Set status to `suspended` |
| Reactivate | status = suspended | Set status to `approved` |
| Change Role | always | Opens a dropdown to select new role |
| View Activity | always | Navigates to a user detail panel |

**Role change rules:**
- Only users with `manage_roles` permission can change roles.
- Users with `manage_users` (but not `manage_roles`) can approve/suspend but cannot change roles.
- No one can downgrade the last remaining `[CONFIGURED: owner_role]` user (enforce this in the API).
- No one can change their own role.

**Screen: User Detail Panel**

Either a slide-over, modal, or separate page showing:
- User profile info (name, email, role, status, timestamps)
- Recent LLM usage (last 10 audit log entries for this user, with total tokens and cost)
- Action buttons (approve, suspend, change role)

**API Endpoints:**

`GET /api/admin/users` — List users with pagination, filtering, sorting.
- Query params: `page`, `per_page`, `sort_by`, `sort_order`, `status`, `role`, `search`
- Requires: `manage_users` permission
- Response: paginated user list

`PATCH /api/admin/users/:id` — Update a user's status or role.
- Body: `{ "status": "approved" }` or `{ "role": "editor" }`
- Requires: `manage_users` permission (for status changes) or `manage_roles` permission (for role changes)
- Validates: cannot remove last `[CONFIGURED: owner_role]`, cannot change own role
- Response: updated user profile

`GET /api/admin/users/:id/activity` — Get a user's recent LLM usage.
- Query params: `page`, `per_page`
- Requires: `manage_users` permission
- Response: paginated audit log entries for this user with cost summaries

**Notifications (optional but recommended):**
- When a new user signs up, admins should see a badge/count on the admin nav item.
- When a user is approved, send them an email notification (via Supabase email or a webhook).

**Reference:** `specs/04-user-management.md`

---

### Module 5: LLM Gateway

**Purpose:** A centralized server-side layer through which EVERY LLM call in the application is routed. This is the architectural backbone that enables prompt management (Module 6) and audit logging (Module 7). No part of the application should ever call an LLM provider directly.

**Why a gateway?**
- Single place to swap models or providers
- Automatic audit logging of every call
- Prompt templates resolved server-side (secrets and logic stay off the client)
- Retry and fallback logic in one place
- Rate limiting and cost controls

**Internal API endpoint:** `POST /api/llm/invoke`

This is a server-side endpoint. It should NOT be directly callable from the client (unless the user explicitly wants that). Feature code on the server calls this endpoint (or its function equivalent) internally.

**Request shape:**

```json
{
  "template_slug": "summarize-article",
  "variables": {
    "content_type": "news article",
    "language": "English",
    "content": "The full text of the article goes here..."
  },
  "user_id": "uuid-of-the-requesting-user",
  "config_overrides": {
    "model": "gpt-4o-mini",
    "temperature": 0.5,
    "max_tokens": 500
  },
  "metadata": {
    "feature": "article-summarizer",
    "request_id": "req_abc123"
  }
}
```

**Fields:**

| Field | Required | Description |
|---|---|---|
| template_slug | Yes (unless `raw_prompt` is provided) | Slug of the prompt template to use |
| variables | Conditional | Required if the template has variables. Key-value pairs. |
| raw_prompt | Only if no template_slug | For ad-hoc calls without a template: `{ "system": "...", "user": "..." }` |
| user_id | No | Attached to the audit log. Null for system-initiated calls. |
| config_overrides | No | Override the template's default model config for this call |
| metadata | No | Arbitrary JSON attached to the audit log entry |

**Processing pipeline (what the gateway does on each call):**

```
0. AUTHORIZE caller
   - If user_id is provided, verify the user's role is in [CONFIGURED: llm_access.roles]
   - If the user's role is not authorized, return UNAUTHORIZED error
   - System calls (no user_id) bypass this check

1. VALIDATE input
   - If template_slug provided: fetch template from DB, verify it exists and is_active
   - If raw_prompt provided: validate it has at least a user prompt
   - Validate all required variables are present

2. RESOLVE prompt
   - Take the template's system_prompt and user_prompt
   - Replace all {{variable_name}} placeholders with provided values
   - If a variable is missing and not required, leave it empty
   - If a variable is missing and required, return error

3. DETERMINE model config
   - Start with the template's model_config
   - Overlay any config_overrides from the request
   - Look up the provider config from llm_provider_config table

4. CALL the LLM provider
   - Start a timer for latency tracking
   - Send the resolved prompt to the appropriate provider SDK
   - Handle the response or catch errors/timeouts

5. CALCULATE cost
   - Extract token counts from the provider response
   - Look up pricing from llm_provider_config
   - Calculate: input_cost = (input_tokens / 1000) × input_price_per_1k
   - Calculate: output_cost = (output_tokens / 1000) × output_price_per_1k

6. LOG to audit table
   - Insert a row into llm_audit_log with ALL details:
     user_id, template_id, template_version, provider, model,
     resolved system_prompt, resolved user_prompt, response,
     status, error_message, token counts, costs, latency, metadata

7. RETURN response
   - On success: return the response text plus metadata
   - On error: return error details (also logged)
```

**Response shape (success):**

```json
{
  "data": {
    "response": "The summarized content goes here...",
    "model": "gpt-4o",
    "provider": "openai",
    "tokens": {
      "input": 1250,
      "output": 300,
      "total": 1550
    },
    "cost_usd": 0.01875,
    "latency_ms": 2340,
    "audit_log_id": "uuid-of-the-log-entry"
  },
  "error": null
}
```

**Response shape (error):**

```json
{
  "data": null,
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "The LLM provider returned an error: rate limit exceeded"
  }
}
```

**Error codes the gateway can return:**

| Code | When |
|---|---|
| UNAUTHORIZED | The user's role is not in `[CONFIGURED: llm_access.roles]` |
| TEMPLATE_NOT_FOUND | The template_slug doesn't match any active template |
| MISSING_VARIABLES | Required template variables not provided |
| PROVIDER_ERROR | The LLM provider returned an error |
| PROVIDER_TIMEOUT | The LLM provider did not respond in time |
| INVALID_CONFIG | Model or provider configuration is invalid |
| RATE_LIMITED | Internal rate limit exceeded (if implemented) |
| GATEWAY_ERROR | Unexpected internal error |

**Provider abstraction:**

The gateway needs a simple provider adapter interface. Each supported provider (OpenAI, Anthropic, Google) has an adapter that:
- Accepts: resolved system prompt, user prompt, model config
- Returns: response text, token counts (input, output)
- Throws: standardized errors

This makes it easy to add new providers — just implement the adapter interface.

**Fallback logic (optional but recommended):**
- Configure a fallback model in `llm_provider_config` or `app_settings`.
- If the primary model call fails, retry once with the fallback.
- Log both attempts in the audit log (the failed one and the retry).

**Reference:** `specs/05-llm-gateway.md`

---

### Module 6: Prompt Management

**Purpose:** An admin UI for creating, editing, testing, and versioning the prompt templates that the LLM Gateway uses. Accessible only to users with the `manage_prompts` permission.

**Route:** `/admin/prompts`

**Screen: Template List**

A table of all prompt templates.

**Columns:**
| Column | Sortable | Filterable |
|---|---|---|
| Name | Yes | Search |
| Slug | No | |
| Feature Tag | Yes | Dropdown |
| Model | Yes | Dropdown |
| Version | Yes | |
| Active | Yes | Toggle: all, active, inactive |
| Last Updated | Yes | |

**Actions:**
- Create New Template (button above table)
- Click row → edit template
- Toggle active/inactive per row

**Screen: Template Editor**

A full editor screen with the following sections:

**6.1 Basic Info**
- Name (text input)
- Slug (auto-generated from name, editable, validated for URL-safety)
- Description (textarea)
- Feature Tag (text input with autocomplete from existing tags)

**6.2 Prompt Editor**
- System Prompt (large textarea with syntax highlighting for `{{variables}}`)
- User Prompt (large textarea with syntax highlighting for `{{variables}}`)
- As the user types, highlight `{{variable_name}}` patterns in a distinct color.
- Show a warning if a `{{variable}}` appears in the prompt but isn't defined in the Variables section.

**6.3 Variables Definition**
- A dynamic list/table where the admin defines each variable:
  - Name (text, validated: lowercase, underscores, no spaces)
  - Type (dropdown: string, number, boolean, text — for UI hint purposes)
  - Description (text)
  - Required (checkbox)
  - Default Value (optional)
- Variables are stored as the `variables` jsonb column on the template.

**6.4 Model Configuration**
- Provider (dropdown: openai, anthropic, google)
- Model (dropdown: filtered by provider, populated from `llm_provider_config`)
- Temperature (slider: 0.0 to 2.0, step 0.1)
- Max Tokens (number input)
- Top P (number input, optional)

**6.5 Live Preview**
- A panel (side panel or below) that shows the fully resolved prompt.
- For each defined variable, show an input field pre-filled with the default value (or empty).
- As the admin fills in variable values, the preview updates in real-time, showing exactly what would be sent to the LLM.
- "Test" button: sends the resolved prompt through the LLM Gateway and shows the response inline. This creates a real audit log entry (useful for testing).

**6.6 Version History**
- A collapsible section showing all previous versions of this template.
- Each entry shows: version number, change note, who changed it, when.
- Click to view the diff (show what changed between versions).
- "Revert to this version" button: creates a new version that matches the old one.

**Save behavior:**
- When saving changes to a template, the system:
  1. Creates a new `prompt_template_versions` row with the current state.
  2. Updates the `prompt_templates` row with the new content.
  3. Increments `current_version`.
  4. Requires a `change_note` (prompted in a modal on save).

**API Endpoints:**

`GET /api/admin/prompts` — List all templates (paginated, filterable).
`POST /api/admin/prompts` — Create a new template.
`GET /api/admin/prompts/:id` — Get a single template with full detail.
`PUT /api/admin/prompts/:id` — Update a template (triggers versioning).
`DELETE /api/admin/prompts/:id` — Soft delete a template.
`GET /api/admin/prompts/:id/versions` — List all versions of a template.
`GET /api/admin/prompts/:id/versions/:version` — Get a specific version.
`POST /api/admin/prompts/:id/revert/:version` — Revert to a specific version.
`POST /api/admin/prompts/:id/test` — Send a test call through the gateway.

All endpoints require `manage_prompts` permission.

**Reference:** `specs/06-prompt-management.md`

---

### Module 7: LLM Audit Trail

**Purpose:** A read-only admin screen for reviewing, analyzing, and exporting all LLM calls made by the application. Accessible to users with the `view_audit_log` permission.

**Route:** `/admin/audit`

**Screen: Audit Dashboard**

At the top, display summary cards:

| Card | Value |
|---|---|
| Total Calls | Count of all audit log entries (filterable period) |
| Total Cost | Sum of `total_cost_usd` (filterable period) |
| Total Tokens | Sum of `total_tokens` (filterable period) |
| Avg Latency | Average of `latency_ms` (filterable period) |
| Error Rate | Percentage of entries with status 'error' or 'timeout' |

Below the cards, display two charts:
- **Cost over time:** Line chart showing daily cost (grouped by day), with optional breakdown by model or provider.
- **Calls over time:** Bar chart showing daily call volume, colored by status (success, error, timeout).

**Screen: Audit Log Table**

Below the dashboard, a paginated, filterable table.

**Columns:**
| Column | Sortable | Filterable |
|---|---|---|
| Timestamp | Yes (default: DESC) | Date range picker |
| User | Yes | Search / dropdown |
| Template | Yes | Dropdown of template names |
| Provider | Yes | Dropdown |
| Model | Yes | Dropdown |
| Status | Yes | Dropdown: all, success, error, timeout |
| Input Tokens | Yes | |
| Output Tokens | Yes | |
| Cost (USD) | Yes | Min/max range |
| Latency (ms) | Yes | Min/max range |

**Row expansion or detail view:**

Clicking a row expands it (or opens a side panel) showing:
- Full resolved system prompt (scrollable, with copy button)
- Full resolved user prompt (scrollable, with copy button)
- Full response text (scrollable, with copy button)
- Error message (if any)
- All metadata
- Link to the template used (navigates to Module 6 editor)
- Link to the user (navigates to Module 4 user detail)

**Cost Analysis Tab:**

A secondary tab or section providing aggregated cost views:

| View | Description |
|---|---|
| Cost by Model | Table: model, call count, total tokens, total cost, avg cost per call |
| Cost by Template | Table: template name, call count, total tokens, total cost |
| Cost by User | Table: user name, call count, total tokens, total cost |
| Cost by Day | Table and chart: date, call count, total cost |

All views filterable by date range.

**Export:**
- "Export CSV" button on the audit log table.
- Exports the current filtered view (not all data) to a CSV download.
- Columns: timestamp, user_email, template_name, provider, model, status, input_tokens, output_tokens, total_tokens, input_cost_usd, output_cost_usd, total_cost_usd, latency_ms.

**API Endpoints:**

`GET /api/admin/audit` — List audit log entries (paginated, filterable, sortable).
- Query params: `page`, `per_page`, `sort_by`, `sort_order`, `status`, `provider`, `model`, `template_id`, `user_id`, `date_from`, `date_to`, `cost_min`, `cost_max`
- Requires: `view_audit_log` permission

`GET /api/admin/audit/:id` — Get a single audit log entry with full detail.
- Requires: `view_audit_log` permission

`GET /api/admin/audit/summary` — Get aggregated summary statistics.
- Query params: `date_from`, `date_to`, `group_by` (model, template, user, day)
- Requires: `view_audit_log` permission

`GET /api/admin/audit/export` — Export filtered audit log as CSV.
- Same query params as the list endpoint.
- Returns: CSV file download
- Requires: `export_audit_log` permission

**Reference:** `specs/07-llm-audit.md`, `references/llm-pricing-table.md`

---

## 7. Admin Navigation

All admin screens share a consistent navigation structure. **Only show nav items the current user has permission to access:**

```
Admin Panel
├── Users        (/admin/users)         — Module 4  — requires: manage_users
├── Prompts      (/admin/prompts)       — Module 6  — requires: manage_prompts
├── LLM Audit    (/admin/audit)         — Module 7  — requires: view_audit_log
└── Settings     (/admin/settings)      — App settings — requires: manage_settings
```

The admin panel is accessible via a navigation element (sidebar link, top-nav dropdown, or similar) that is only visible to users whose role is in `[CONFIGURED: admin_access.roles]`. Within the admin panel, individual nav items are shown/hidden based on the user's specific permissions.

---

## 8. Implementation Checklist

Use this to verify completeness after implementation. Every item should be verifiable.

### Pre-Implementation Configuration
- [ ] Configuration interview completed with user
- [ ] `vibekit.config.yaml` generated with all answers
- [ ] Roles, permissions, signup behavior, and admin access defined
- [ ] Configuration values propagated to all module implementations

### Module 1: Project Setup
- [ ] Project scaffolded in chosen framework
- [ ] `vercel.json` configured (if needed)
- [ ] `.env.example` created with all required variables (including providers from config)
- [ ] `.env` is in `.gitignore`
- [ ] `vibekit.config.yaml` committed to repo
- [ ] `GET /api/health` returns correct shape and pings Supabase
- [ ] Successfully deploys to Vercel

### Module 2: Database
- [ ] All 8 tables created with correct columns and types
- [ ] `roles` table seeded with configured roles
- [ ] `role_permissions` table seeded with configured permissions
- [ ] RLS enabled on every table with permission-based policies
- [ ] Indexes created on `llm_audit_log`
- [ ] Trigger: auto-update `updated_at` on user_profiles, prompt_templates, and roles
- [ ] Trigger: auto-create user_profiles row on auth.users insert (with configured default role and approval behavior)
- [ ] Trigger: auto-create prompt_template_versions row on prompt_templates update
- [ ] First user gets `[CONFIGURED: owner_role]` and `approved` status
- [ ] `has_permission()` helper function implemented and working

### Module 3: Authentication
- [ ] Sign up creates auth user + profile with `[CONFIGURED: default_role]`
- [ ] If require_approval: signup → pending status → /pending-approval screen
- [ ] If not require_approval: signup → approved status → direct app access
- [ ] Login checks status correctly (pending/suspended/approved)
- [ ] Password reset flow works end to end
- [ ] OAuth login works (if configured)
- [ ] Route protection uses `[CONFIGURED: admin_access.roles]` for admin routes
- [ ] Route protection checks specific permissions for admin sub-routes
- [ ] First user is auto-approved as `[CONFIGURED: owner_role]`
- [ ] Logout clears session and redirects

### Module 4: User Management
- [ ] User list shows all users with correct columns
- [ ] Role filter dropdown populated dynamically from `roles` table
- [ ] Filtering by status, role, and search works
- [ ] Approve, suspend, reactivate actions require `manage_users` permission
- [ ] Role change requires `manage_roles` permission
- [ ] Cannot remove last `[CONFIGURED: owner_role]`
- [ ] Cannot change own role
- [ ] User detail shows recent LLM usage

### Module 5: LLM Gateway
- [ ] Template-based calls resolve variables correctly
- [ ] Raw prompt calls work
- [ ] Config overrides apply correctly
- [ ] LLM access restricted to `[CONFIGURED: llm_access.roles]`
- [ ] Every call creates an audit log entry
- [ ] Token counts and costs calculated correctly
- [ ] Error responses are structured and logged
- [ ] At least one provider adapter implemented (per `[CONFIGURED: llm_providers]`)

### Module 6: Prompt Management
- [ ] Template list with filtering and sorting
- [ ] Access restricted to users with `manage_prompts` permission
- [ ] Template editor with all sections (info, prompts, variables, config, preview)
- [ ] Variable syntax highlighting in prompt text areas
- [ ] Live preview resolves variables in real-time
- [ ] Test button sends call through gateway and shows response
- [ ] Save creates a version entry and requires change note
- [ ] Version history shows all previous versions
- [ ] Revert to version works

### Module 7: LLM Audit Trail
- [ ] Access restricted to users with `view_audit_log` permission
- [ ] Dashboard summary cards show correct aggregates
- [ ] Cost over time and calls over time charts render
- [ ] Audit log table with pagination, filtering, sorting
- [ ] Row expansion shows full prompts, response, and metadata
- [ ] Cost analysis views work (by model, template, user, day)
- [ ] CSV export requires `export_audit_log` permission
- [ ] CSV export downloads correct filtered data

---

## 9. What Comes Next (Your Product)

After implementing these seven modules, you have a fully operational foundation: hosted app, database, auth, user management, and a complete LLM infrastructure with prompt management and audit logging.

Now build your product. Every LLM feature you add follows this pattern:

1. **Create a prompt template** in the Prompt Management UI (Module 6).
2. **Call the LLM Gateway** from your feature code with the template slug and variables.
3. **It's automatically logged** in the Audit Trail (Module 7).

That's it. No provider SDKs in your feature code. No manual logging. No cost tracking logic. Just template slugs and variables.

---

*This specification is version 1.0. When in doubt about implementation details, prioritize: correctness over speed, security over convenience, and clarity over cleverness.*
