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

- No hosted Supabase project has been connected or migrated for V2. Supabase dashboard requires sign-in through the secure browser flow.
- Required application configuration: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `APP_URL`. No values configured yet; no service-role key belongs in this app.
- No live accounts, medical records or financial data were uploaded. Demo content is fictional and read-only.
- Provision an isolated Supabase project, verify project identity and environment configuration, apply both SQL migrations once, configure exact auth callbacks and enabled providers, then redeploy and test two accounts and two families.
- Existing application and its production database remain untouched.
