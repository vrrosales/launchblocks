# Vercel Deploy Checklist

Step-by-step checklist for deploying your Launchblocks project to Vercel.

## Pre-Deployment

- [ ] All environment variables are set in `.env.local`
- [ ] SQL migrations have been run in Supabase (all 4 files in order)
- [ ] Supabase project is created and configured
- [ ] At least one LLM provider API key is valid
- [ ] App builds locally without errors (`npm run build`)
- [ ] Auth callback URLs are configured in Supabase

## Supabase Configuration

### 1. Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization, name, password, region
4. Wait for project to provision

### 2. Run Migrations
1. Go to SQL Editor in Supabase Dashboard
2. Run each migration file in order:
   - `001_roles_and_permissions.sql`
   - `002_users_and_profiles.sql`
   - `003_prompt_templates.sql`
   - `004_llm_audit_log.sql`

### 3. Configure Auth
1. Go to Authentication → Providers
2. Enable Email provider (enabled by default)
3. Optional: Enable OAuth providers (Google, GitHub, etc.)
4. Go to Authentication → URL Configuration
5. Set Site URL to your Vercel domain (e.g., `https://your-app.vercel.app`)
6. Add redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

### 4. Get API Keys
1. Go to Settings → API
2. Copy: Project URL, `anon` key, `service_role` key

## Vercel Deployment

### 1. Connect Repository
1. Go to https://vercel.com/new
2. Import your Git repository
3. Select the framework preset (Next.js, etc.)

### 2. Set Environment Variables
Add these in Vercel → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `OPENAI_API_KEY` | Your OpenAI API key (if using) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (if using) |
| `GOOGLE_AI_API_KEY` | Your Google AI API key (if using) |

### 3. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployment URL

### 4. Post-Deploy
1. Update Supabase Site URL to your Vercel domain
2. Update redirect URLs in Supabase Auth settings
3. Create your first admin user by signing up
4. Manually set that user's role to the owner role in Supabase:
   ```sql
   UPDATE public.user_profiles
   SET role = 'super_admin', status = 'approved'
   WHERE email = 'your-email@example.com';
   ```

## Troubleshooting

### "Invalid API key"
- Double-check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon** key, not the service role key
- Ensure environment variables are set for the correct Vercel environment (Production/Preview/Development)

### Auth redirects not working
- Verify redirect URLs in Supabase Authentication → URL Configuration
- Make sure Site URL matches your Vercel domain exactly
- Check that `/auth/callback` route is implemented

### RLS errors (permission denied)
- Ensure all 4 migrations ran successfully
- Check that the user has the correct role in `user_profiles`
- Verify RLS policies are enabled on all tables

### Build failures
- Check that all required environment variables are set
- Ensure `node` version matches `engines` requirement (>=18)
- Review build logs in Vercel dashboard
