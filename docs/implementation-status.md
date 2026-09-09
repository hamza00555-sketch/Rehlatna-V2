# Foundation and deployment status — 2026-09-09

- Repository: hamza00555-sketch/Rehlatna-V2; branch `feat/foundation`, base `main`; draft PR #1 is open.
- Public source publication was explicitly approved by the repository owner.
- Production build, strict TypeScript checks and all 13 tests pass locally and on GitHub Actions.
- Tests cover PostgreSQL RLS isolation, record sharing/revocation, membership revocation, invitation email binding/expiry/replay, private storage policies, safe redirects and early gestation dates.

## Deployed interface

- URL: https://rehlatna-v2.vercel.app
- Vercel project: `rehlatna-v2` (`prj_Piz8uMERx9IJyBDyFjL0s9x5eehI`).
- Deployment: `dpl_3LG1q17D5YDP9Kec9zPsLvFTbx3J`, READY; Next.js, Node 24.
- Source snapshot: application files at commit `7f29c2ace87b203109565f58de442f4104d4d8d8`.
- Requested target was preview; Vercel reports the first deployment as production and assigns the project domain. This is an unconfigured interface preview, not a production-ready service.
- Deployed through the connector from source files. Automatic GitHub-to-Vercel deployment linkage has not been verified.
- Browser verification: landing page, all four demo tabs, navigation to auth, and disabled login controls with an explicit unconfigured notice. Visually inspected the demo screen at desktop size. Mobile and authenticated acceptance testing remain outstanding.

## Remaining setup

- Supabase sign-in is complete. Created isolated free project `rehlatna-v2-preview`, ref `zhknyqqjlrdiscmmbfqb`, in Frankfurt (`eu-central-1`). The legacy `rehlatna` project is untouched.
- Applied both checked-in SQL migrations once through the authenticated SQL Editor. Both returned `Success. No rows returned`. Full SQL text was checked against the local files before execution. Automatic RLS was enabled and automatic exposure of new tables disabled at project creation.
- Configured `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `APP_URL` locally and in the new deployment. Only the publishable key was used. No service-role key or database password was copied into the app or repository.
- Supabase Site URL is `https://rehlatna-v2.vercel.app`. Allowed callback is `https://rehlatna-v2.vercel.app/auth/callback**`, scoped to the app origin and callback prefix so the validated `next` query can be preserved.
- Connected deployment `dpl_3jUxtZsxSAQEBKXV9EVn9y1EZVWc` is READY on the same project domain. Production build and TypeScript succeeded with the real public configuration. Deployment environment values were supplied through the Vercel connector; project-wide persistence and automatic Git deployments are not yet verified.
- Live API checks: auth settings return HTTP 200 with email enabled and Google disabled; anonymous reads of `households` and `private_records` are rejected with HTTP 401 / PostgreSQL `42501`.
- Browser confirms the deployed email form is enabled. Google UI and server action are guarded by `GOOGLE_AUTH_ENABLED=true`, which remains false until its provider is configured and verified.
- The automated email sign-in test was blocked by automatic approval review: an explicit recipient and authorization to send the login email are required. No login email was sent by that attempt. Hosted login/callback and two-account family/sharing acceptance tests therefore remain unverified.
- Google OAuth credentials and custom SMTP have not been configured; broader signup/email delivery is not validated.
- No live accounts, medical records or financial data were uploaded. Demo content is fictional and read-only.
- Next: obtain explicit authorization for the test email recipient, verify the email callback in the initiating browser, test two accounts and two families, configure Google/custom SMTP, and verify persistent project environment settings and Git integration before public onboarding.
- Existing application and its production database remain untouched.
