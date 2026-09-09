import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function googleEnabled() {
  return configured() && process.env.GOOGLE_AUTH_ENABLED === 'true';
}
export function appOrigin() {
  const raw = process.env.APP_URL;
  if (!raw) throw new Error('APP_URL is required');
  const url = new URL(raw);
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  )
    throw new Error('Invalid APP_URL');
  return url.origin;
}
export const db = cache(async () => {
  if (!configured()) throw new Error('Supabase is not configured');
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            /* Server Component: refresh handled by proxy. */
          }
        },
      },
    },
  );
});
export const user = cache(async () => {
  if (!configured()) return null;
  const client = await db();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
});
export async function requireUser() {
  const current = await user();
  if (!current) redirect('/auth');
  return current;
}
export const context = cache(async () => {
  const current = await requireUser();
  const client = await db();
  const { data, error } = await client
    .from('memberships')
    .select('household_id,display_name,role,households(name)')
    .eq('user_id', current.id)
    .eq('active', true)
    .order('created_at');
  if (error) throw new Error('تعذر تحميل العائلة. حاول مرة أخرى.');
  if (!data?.length) redirect('/setup');
  const selected = (await cookies()).get('rehlatna-family')?.value;
  const membership = data.find((x) => x.household_id === selected) ?? data[0];
  return {
    client,
    current,
    membership,
    memberships: data,
    householdId: membership.household_id as string,
  };
});
