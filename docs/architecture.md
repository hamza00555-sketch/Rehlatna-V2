# Security and data ownership

The HTTP app uses the caller's Supabase session, never a service-role client. `getUser()` verifies the current user; PostgreSQL RLS independently checks active membership and record ownership/share access. A selected-household cookie is only a UI preference and is verified against the caller's memberships on every request.

## Schema

| Table               | Boundary                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| households          | Active members read only; created atomically through RPC               |
| memberships         | Household members can read; no direct user writes                      |
| private.invitations | No client table access; email-bound acceptance under row lock          |
| pregnancies         | Shared family due date; only owner/editor writes; one active pregnancy |
| appointments        | Shared title/time/location; no private clinical details                |
| preparation_items   | Shared checklist; owner/editor writes                                  |
| private_records     | Owner + explicitly granted readers; owner-only edit/delete             |
| record_shares       | Owner grants/revokes; recipients cannot re-share                       |

`owner`, `editor`, `viewer` are household permissions, not genders. The app deliberately separates family administration from private data ownership. Any permitted record creator can manage their own financial record. No implicit financial role is inferred from being the father.

Primary keys and tenant/owner columns have no authenticated UPDATE grants. Composite foreign keys prevent a share crossing households. An owner cannot invite another owner or promote a member via direct table writes. Owner transfer is not implemented yet.

Invitation tokens are random 256-bit secrets; only SHA-256 hashes are stored in a private schema. Tokens are email-bound, expire after 48 hours and are consumed under `FOR UPDATE` in a transaction. Only household owners create invitations; creation is capped at 20/day per household. This is a coarse safeguard, not a replacement for platform abuse controls. Existing active membership is never escalated by claiming another invite.

Revocation marks a membership inactive and removes its incoming shares. Private records owned by the revoked member are retained without becoming readable by the household owner. Re-enrollment requires a new valid invite; access to the member's own retained records is restored within that household. A separate user-data export/deletion process is required before real production onboarding.

## Local verification

`tests/security.test.ts` runs the actual foundation SQL against PGlite's PostgreSQL engine with `authenticated` and `anon` roles, fixture `auth.uid()`/`auth.jwt()` functions and four users across two families. Tests cover tenant isolation, no admin self-grant, read-only shares, revoke, immutable owner/tenant keys, viewer writes, invitation recipient/expiry/replay, revocation with retained private data and anonymous access. The storage policies are also applied against fixture storage tables and tested for owner/tenant boundaries; hosted upload validation, auth and network integration still need live testing.

## Design

`docs/design-system.json` is the extracted Maswada v4 reference. `src/design/tokens.css` resolves its semantic token names. The demo uses fictional planning examples and a labeled week number. It does not fabricate clinical imagery or claim a medically validated developmental timeline.

## References

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/server-side/advanced-guide
- https://vercel.com/docs/git
- https://nextjs.org/blog/august-2026-security-release
