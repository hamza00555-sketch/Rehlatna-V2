# Implementation status — 2026-09-09

Repository: `hamza00555-sketch/Rehlatna-V2`, branch `feat/foundation`, draft PR #1 to `main`. The owner approved public source publication and deployment. The existing application and its database are untouched.

## Visual refinement

Rebuilt the welcome page, all four demo tabs and authentication presentation. Added a responsive navigation rail, mobile floating navigation, a photographic pregnancy/preparation hero, appointment cards, differentiated family/private cards, a timeline and a preparation progress summary. Shared components also style the connected today, journey, preparation and family routes. The generated nursery photo is decorative; it is not fetal growth evidence. See `visual-direction.md`.

Production build and strict TypeScript pass locally after these changes. The existing 13 tests passed for the foundation; this visual change does not change database policies or auth actions. Desktop browser review covered the welcome, today, journey, preparation and auth screens; the family page was checked for content. The navigation/header overlap found in the first visual build was corrected and measured absent in the final build. All four demo routes load. The delivered WebP matches the local asset byte-for-byte and loads through Next Image. The auth form remains enabled and the Google button remains hidden. Pointer dispatch repeatedly timed out in the browser connection, so navigation was checked by opening the observed link destinations. Mobile breakpoints are implemented but a mobile-device visual check remains outstanding. Authenticated multi-account acceptance testing remains outstanding.

## Deployment and configuration

- Public URL: https://rehlatna-v2.vercel.app
- Vercel project: `rehlatna-v2`, `prj_Piz8uMERx9IJyBDyFjL0s9x5eehI`.
- Latest visual deployment: `dpl_2C52rFDpv5aJGXGX8MP65MFZr2Rw`, READY with the canonical domain assigned. The initial visual deployment was followed by a navigation-grid correction identified during browser review.
- Last verified connected deployment before visual refinement: `dpl_8djPRDMfRMyg451b5v6CPXNKEhHe`.
- Deployments are sent through the connector from an explicit tracked-file list. Automatic GitHub deployment integration is not verified.
- Correction to earlier status: top-level connector `env` and `build.env` did not reach the deployed app. Deployments `dpl_3jUxtZsxSAQEBKXV9EVn9y1EZVWc` and `dpl_4e5icLhChwnHPLUYXf6sGFqSFHWx` did not have working login configuration. A fast DOM view omitted the disabled state; a full snapshot and actual email test caught this.
- Working connector fallback injects only four explicitly public settings into a deployment copy of Next config: the Supabase URL, publishable key, app origin and Google-enabled flag. No secrets may use this path. `scripts/prepare-deployment.mjs` validates the allowlist and produces ignored `.vercel/configured-deploy.json`, including binary assets as base64. Preferred long-term configuration remains Vercel project environment settings; persistence has not been verified.

## Database and auth

- Isolated free Supabase project `rehlatna-v2-preview`, ref `zhknyqqjlrdiscmmbfqb`, Frankfurt. Legacy ref `bryhvicmqweixeewxocg` is untouched.
- Both checked-in SQL migrations were applied exactly once through the authenticated SQL Editor and succeeded. Do not rerun them. Automatic RLS was enabled and automatic new-table exposure disabled.
- Only the publishable key is used in the app. No service-role key or database password is committed or embedded.
- Site URL: `https://rehlatna-v2.vercel.app`; allowed callback: `https://rehlatna-v2.vercel.app/auth/callback**`.
- Live anonymous reads of households and private records were rejected (HTTP 401 / PostgreSQL 42501). Local tests cover cross-family isolation, private sharing and revocation, invitation email binding/expiry/replay, storage policies, redirects and gestation calculations.
- The owner explicitly approved a login email to his own address and confirmed receipt. The earlier approval block is resolved for that test. This does not verify completion of the callback. PKCE callback must return to the browser that initiated login.
- There is no owner notification or email-forwarding hook in app signup. Login mail targets the address submitted by the account holder. The test targeted the owner because his address was entered for that test.
- Google remains disabled until a valid OAuth client is configured. Attempting to open Google Cloud in the connected browser returned “Site Unavailable / Unable to access this site”; no credentials were created or provider flags enabled.
- Supabase default SMTP remains configured, with project-team recipient restrictions. Public email signup is not ready. A verified sender domain, custom SMTP provider and Arabic branded templates are required. Switching database providers is not necessary to obtain independent user accounts.
- No family medical/financial records were uploaded; preview examples are fictional and read-only.

## Remaining public launch work

1. Configure Google OAuth, branded consent screen, Supabase callback and public audience; then verify login before enabling the button.
2. Configure custom SMTP with a verified sender owned by the product, apply branded email templates and test an external account. Do not redirect users' authentication mail to the owner.
3. Complete hosted callback and two-account/two-family acceptance checks, private sharing/revocation and sign out.
4. Verify persistent Vercel environment settings and Git deployment integration, and complete the remaining production gates in `setup.md`.

## Screen-spec alignment follow-up

The complete screen specification is now tracked by `screen-spec-audit.md`, which compares every section with shipped code, records contradictions and orders the remaining work. This is still a partial implementation of that specification, not a complete application.

The today hero now uses `BabyHero`, replacing the nursery-based pregnancy card. An exact-week manifest exposes a newly generated, explicitly unreviewed week-24 poster in demo only. No weekly video has been generated or attached. Real accounts never receive that unreviewed poster. Weeks 0–4 have no fetus image or measurements, and missing weeks never borrow adjacent media. Week pages were added at `/today/week` and `/demo/week`; navigation now labels its fourth destination “المزيد” with a `/more` entry. A sourced warning-signs sheet was added.

Local production build, TypeScript, formatting and 15 tests pass (the two new tests cover trimester/day calculations and strict media matching). The first weekly-hero deployment is `dpl_3hLGThBg7WNUQLvuU4g7EcW7friS`, READY. Desktop browser rendering of the new hero was visually checked. Browser pointer actions continue to time out at the browser transport even when the button is found and enabled; interactive expansion/focus/escape and real-video playback require subsequent acceptance verification. No claim is made that a loop was tested without a video file. Mobile visual acceptance remains pending.

Final source cleanup removes the unused nursery pregnancy component. Deployment `dpl_ogvQmUZaoAyamLSPHxQXtJZqiaAk` contains that cleanup. The browser confirmed `/demo/week?week=4` has no image elements and displays no fetal measurements; future videos remain absent. The comparison report is the current completion reference.
