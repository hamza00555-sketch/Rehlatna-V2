# New preview environment

1. Create a dedicated Supabase project for **Rehlatna V2 preview**. Do not use the legacy Rehlatna project or its JSON household tables.
2. Apply `supabase/migrations/202609090001_foundation.sql` in a transaction, then `202609090002_private_storage.sql`. Both target a fresh schema. Do not repeatedly apply them to an already migrated database.
3. Enable email-link auth and Google in Supabase. Configure Google provider credentials there. Configure Auth Site URL and allowed redirect URLs to the canonical preview domain plus `/auth/callback`. Use exact domains, not a wildcard across untrusted previews. Local development may add `http://localhost:3000/auth/callback`.
4. Import this GitHub repository into a **new** Vercel project. Production branch is `main`; feature branches are previews. Configure the three variables in `.env.example` for the preview environment. `APP_URL` must be the canonical HTTPS preview origin matching Supabase redirects. The publishable key is intended for public use; never add a service-role key to this app.
5. Pull or securely enter preview configuration locally. Never commit `.env.local`. Verify project identity and all three variable names before connected dev/migration commands.
6. Build and deploy, then verify two real test accounts (email + Google), invitation email binding, another household, sharing, logout, revoked membership and expired links. The browser flow must use the same browser for email PKCE initiation and callback.
7. For email-link delivery, configure production SMTP and provider rate limits before public signup. App responses do not enumerate existing accounts. Invitation links are manually shared by the inviter; the app does not claim it sent an invitation email.

## Production gate

Create independent production environment variables and a production database. Take a backup and prove restoration on a disposable project before transferring any real data. Use versioned SQL migrations and a dry-run data conversion script before any legacy migration. Vercel code rollback does **not** roll back a database migration.

Test private export/deletion, owner handover, audit events and attachment lifecycle before real families onboard. Limit Vercel production deployments to reviewed code and required CI checks. No production database has been changed by this repository's local tests.
