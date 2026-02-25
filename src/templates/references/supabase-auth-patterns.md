# Supabase Auth Patterns

Reference guide for implementing authentication with Supabase Auth.

## Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Email/Password Signup

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'John Doe',
    },
  },
});
```

## Email/Password Login

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword',
});
```

## OAuth Login

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google', // or 'github', 'discord', etc.
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Magic Link

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Password Reset

```typescript
// Step 1: Send reset email
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: `${window.location.origin}/auth/reset-password` }
);

// Step 2: Update password (on the reset page)
const { error } = await supabase.auth.updateUser({
  password: 'newpassword',
});
```

## Session Management

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') { /* handle sign in */ }
  if (event === 'SIGNED_OUT') { /* handle sign out */ }
  if (event === 'TOKEN_REFRESHED') { /* handle token refresh */ }
});

// Sign out
await supabase.auth.signOut();
```

## Server-Side Auth (Next.js App Router)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

## Auth Callback Route (Next.js)

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient(); // use server client from above
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
```

## Middleware Protection (Next.js)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

## Row Level Security Patterns

```sql
-- User can only read their own data
CREATE POLICY "Users read own data" ON public.some_table
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Permission-based access
CREATE POLICY "Admins read all" ON public.some_table
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'manage_users'));

-- Role-based access
CREATE POLICY "Owner full access" ON public.some_table
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
```
