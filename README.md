# WordMaster

Personal language-learning app built with Next.js + Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```
2. Create `.env.local` in the project root.
3. Add all required environment variables (see below).
4. Start the app:
```bash
npm run dev
```
5. Open `http://localhost:3000`.

## Required Environment Variables

Add these to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

Notes:
- `NEXT_PUBLIC_*` values are used by browser/client code.
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are used by server actions (`app/actions/vocab.ts`).
- `GEMINI_API_KEY` is required for AI-powered vocabulary generation (`app/actions/ai.ts`).

## Supabase Requirements

Minimum expected setup:

- Auth enabled (email/password is used by current login page).
- `vocab` table has a `user_id` column (linked to auth user identity).
- New vocab writes are owned by the authenticated user (`user_id` is set in server actions).
- Row Level Security (RLS) should be enabled for `vocab`.

Recommended `vocab` RLS policy model:
- `SELECT`: `user_id = auth.uid()`
- `INSERT`: `WITH CHECK user_id = auth.uid()`
- `UPDATE`: `USING user_id = auth.uid()` + `WITH CHECK user_id = auth.uid()`
- `DELETE`: `USING user_id = auth.uid()`

## Run Locally

```bash
npm run dev
```

Optional checks:
```bash
npm run lint
npm run build
```

## Known Limitations / Future Improvements

- Route protection is currently client-side via `AuthGate`; middleware/server-side auth gating could be stronger.
- Sign-up/password-reset UI is not implemented yet (login + sign-out only).
- Some pages still use broad client-side reads and can be narrowed further.
- Security still depends on correct live Supabase RLS/policy configuration.
