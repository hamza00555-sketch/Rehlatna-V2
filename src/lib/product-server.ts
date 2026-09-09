import 'server-only';
import { cache } from 'react';
import { context } from './supabase';
import type { Permission } from './product';
export const productContext = cache(async () => {
  const ctx = await context();
  const { data, error } = await ctx.client
    .from('pregnancies')
    .select('*')
    .eq('household_id', ctx.householdId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('تعذر تحميل الرحلة');
  return { ...ctx, pregnancy: data?.[0] ?? null };
});
export async function requirePermission(permission: Permission) {
  const ctx = await productContext();
  if (!ctx.can(permission)) throw new Error('ليس لديك صلاحية لهذا الإجراء');
  return ctx;
}
export async function records(table: string, permission: Permission) {
  const ctx = await productContext();
  if (!ctx.can(permission)) return [];
  const { data, error } = await ctx.client
    .from(table)
    .select('*')
    .eq('household_id', ctx.householdId);
  if (error) throw new Error('تعذر تحميل البيانات');
  return data ?? [];
}
