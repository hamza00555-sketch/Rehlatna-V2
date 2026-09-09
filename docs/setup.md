# New preview environment

1. Create a dedicated Supabase project for **Rehlatna V2 preview**. Do not use the legacy Rehlatna project or its JSON household tables.
2. Apply `supabase/migrations/202609090001_foundation.sql` in a transaction, then `202609090002_private_storage.sql`. Both target a fresh schema. Do not repeatedly apply them to an already migrated database.
3. Enable email-link auth and Google in Supabase. Configure Google provider credentials there. Configure Auth Site URL and allowed redirect URLs to the canonical preview domain plus `/auth/callback`. Use exact domains, not a wildcard across untrusted previews. Local development may add `http://localhost:3000/auth/callback`.
4. Import this GitHub repository into a **new** Vercel project. Production branch is `main`; feature branches are previews. Configure the three variables in `.env.example` for the preview environment. `APP_URL` must be the canonical HTTPS preview origin matching Supabase redirects. The publishable key is intended for public use; never add a service-role key to this app.
5. Pull or securely enter preview configuration locally. Never commit `.env.local`. Verify project identity and all three variable names before connected dev/migration commands.
6. Build and deploy, then verify two real test accounts (email + Google), invitation email binding, another household, sharing, logout, revoked membership and expired links. The browser flow must use the same browser for email PKCE initiation and callback.
7. For email-link delivery, configure production SMTP and provider rate limits before public signup. App responses do not enumerate existing accounts. Invitation links are manually shared by the inviter; the app does not claim it sent an invitation email.

Google sign-in is opt-in: set `GOOGLE_AUTH_ENABLED=true` only after its provider credentials and redirects work in Supabase. Without this flag the Google button is omitted and the server action rejects direct requests. Email login remains available independently.

Current V2 project and deployment details are recorded in `implementation-status.md`. Both initial migrations have already been applied to that project; do not run them again. Deployment-level environment values are not evidence that project-wide environment values or Git integration are configured.

## Production gate

Create independent production environment variables and a production database. Take a backup and prove restoration on a disposable project before transferring any real data. Use versioned SQL migrations and a dry-run data conversion script before any legacy migration. Vercel code rollback does **not** roll back a database migration.

Test private export/deletion, owner handover, audit events and attachment lifecycle before real families onboard. Limit Vercel production deployments to reviewed code and required CI checks. No production database has been changed by this repository's local tests.

## Connector deployment fallback

When project environment settings cannot be supplied through the connector, run `node scripts/prepare-deployment.mjs` after staging the intended source and public assets. It reads `.env.local`, validates the four public settings and writes the ignored `.vercel/configured-deploy.json` file to submit as `files` to the deployment connector. It injects a deployment-only `env` block into Next config. These values are deliberately public; never add a client secret, SMTP password, database password or service-role key to that block. Binary public assets are encoded as base64. The tracked source config stays environment-independent.

## Public account ownership

Every end user gets an independent Supabase Auth identity and signs in to the Rehlatna app, not the Supabase dashboard. Emails from the current `emailLogin` action go to its validated input address; there is no admin recipient or signup notification in that action. A test using the owner's email is not a forwarding rule.

Google setup needs a Google Auth Platform web client with authorised origin `https://rehlatna-v2.vercel.app` and redirect URI `https://zhknyqqjlrdiscmmbfqb.supabase.co/auth/v1/callback`. Configure branding, audience and required verified app details; keep client secrets only in the Supabase provider settings. Set `GOOGLE_AUTH_ENABLED=true` after a successful round-trip test.

For email, Supabase's built-in SMTP is restricted to project team addresses and is not the public product mailer. Configure a custom SMTP service and a verified sender domain, then use the product's name, Arabic templates and the user's recipient address. Do not disable confirmation as a shortcut. Templates and sender branding are separate settings; changing a template alone does not change the sender.

Official setup references: [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Next config public env behaviour](https://nextjs.org/docs/app/api-reference/config/next-config-js/env).
