# رحلتنا V2

Arabic-first shared pregnancy companion, rebuilt in a separate repository. This is the **foundation release**, not the completed pregnancy/birth/postpartum product.

## Implemented

- Approved semantic design tokens (Maswada v4), Arabic RTL, IBM Plex Sans Arabic and Inter, responsive shell and explicit read-only demo at `/demo`.
- Supabase SSR email-link and Google authentication; verified `getUser()` identity on protected reads/actions; safe callback destinations.
- Atomic household creation, membership selection, email-bound 48-hour single-use invitations, immediate membership revocation.
- Shared due-date setup, appointment creation/list, preparation creation/status updates.
- Private medical/financial records, per-record read-only sharing and revocation. Household owners cannot see or self-grant access to another member's private record.
- Normalized SQL schema and real PostgreSQL RLS tests using isolated PGlite.

## Run and verify

Use Node 22.18+ or Node 24. Install with `npm ci`. `npm test` runs disposable local database security checks without credentials. `npm run typecheck` and `npm run build` verify the code.

For the connected application, configure `.env.local` from `.env.example`, follow `docs/setup.md`, then run `npm run dev`. Missing Supabase configuration deliberately disables login; `/demo` remains an explicit visual preview. There is no fake logged-in account or production fallback store.

## Routes

`/` welcome · `/auth` sign-in · `/auth/callback` PKCE callback · `/setup` family creation · `/join` invite acceptance · `/today` summary · `/pregnancy` due date · `/journey` appointments · `/preparation` checklist · `/family` members/invitations · `/private` private records/shares · `/demo` read-only examples.

## Important limits

- Authentication, redirects, email delivery and Supabase Storage need verification against a configured **new preview Supabase project**. Local RLS tests do not prove external OAuth/email configuration.
- Only the SQL foundation is implemented for attachments; upload/download UI and file sharing are not shipped in this slice.
- No fetal image/video has been imported from the old app: its gestational mismatch is not carried over. Weekly medically reviewed content, image/video pipeline, complete birth/postpartum flows, financial goal engine and reminders are later slices.
- App manifest supports an app-like launch; no offline data cache or App Store binary is claimed.
- Authorization changes apply to subsequent requests. Previously viewed/downloaded content cannot be remotely erased.
- Account deletion/export, ownership transfer, audit trail and recovery drills are production-readiness gates still to implement. Do not onboard real medical data before completing them.

See `docs/architecture.md` for security boundaries and `docs/setup.md` for isolated deployment and migrations. The legacy repository and database are not migration targets.
