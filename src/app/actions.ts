'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { appOrigin, context, db, requireUser } from '@/lib/supabase';
import { familySchema, inviteSchema, safeNext, shortText, uuid } from '@/lib/validation';
export type FormState = { error?: string; success?: string; inviteUrl?: string };
const bad: FormState = { error: 'تعذر حفظ التغيير. راجع البيانات وصلاحية حسابك ثم حاول مرة أخرى.' };
export async function emailLogin(_: FormState, form: FormData): Promise<FormState> {
  const email = z.string().trim().email().max(254).safeParse(form.get('email'));
  if (!email.success) return { error: 'اكتب بريدًا إلكترونيًا صحيحًا.' };
  const next = safeNext(form.get('next'));
  const client = await db();
  const { error } = await client.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: appOrigin() + '/auth/callback?next=' + encodeURIComponent(next) },
  });
  return error
    ? { error: 'تعذر إرسال الرابط. انتظر قليلًا وحاول مجددًا.' }
    : {
        success:
          'إذا كان البريد صالحًا لاستقبال الرسائل، سيصلك رابط الدخول. راجع البريد والرسائل غير المرغوبة.',
      };
}
export async function googleLogin(form: FormData) {
  const client = await db();
  const next = safeNext(form.get('next'));
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: appOrigin() + '/auth/callback?next=' + encodeURIComponent(next) },
  });
  if (error || !data.url) redirect('/auth?error=provider');
  redirect(data.url);
}
export async function signOut() {
  const client = await db();
  await client.auth.signOut();
  (await cookies()).delete('rehlatna-family');
  redirect('/');
}
export async function createFamily(_: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const parsed = familySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'اكتب اسم العائلة واسمك، بحد أقصى 80 حرفًا لكل منهما.' };
  const client = await db();
  const { data, error } = await client.rpc('create_household', {
    family_name: parsed.data.familyName,
    member_name: parsed.data.memberName,
  });
  if (error) return bad;
  (await cookies()).set('rehlatna-family', data, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  redirect('/today');
}
export async function createInvite(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const p = inviteSchema.safeParse({ ...Object.fromEntries(form), householdId: ctx.householdId });
  if (!p.success) return { error: 'راجع البريد ودور العضو.' };
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  const { error } = await ctx.client.rpc('create_invitation', {
    hid: ctx.householdId,
    recipient_email: p.data.email,
    invite_role: p.data.role,
    hash,
  });
  return error
    ? bad
    : {
        inviteUrl: appOrigin() + '/join?token=' + token,
        success: 'الدعوة جاهزة لمدة 48 ساعة. شارك الرابط مع صاحب البريد المحدد.',
      };
}
export async function acceptInvite(_: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const p = z
    .object({ token: z.string().regex(/^[0-9a-f]{64}$/), memberName: shortText })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'الدعوة غير صالحة أو الاسم غير مكتمل.' };
  const client = await db();
  const { data, error } = await client.rpc('accept_invitation', {
    hash: createHash('sha256').update(p.data.token).digest('hex'),
    member_name: p.data.memberName,
  });
  if (error)
    return { error: 'الدعوة منتهية أو مستخدمة، أو أنك دخلت ببريد مختلف عن البريد المدعو.' };
  (await cookies()).set('rehlatna-family', data, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  redirect('/today');
}
export async function removeMember(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const id = uuid.safeParse(form.get('memberId'));
  if (!id.success) return bad;
  const { error } = await ctx.client.rpc('remove_member', { hid: ctx.householdId, uid: id.data });
  if (error) return bad;
  revalidatePath('/family');
  return { success: 'تم إيقاف وصول العضو.' };
}
export async function switchFamily(form: FormData) {
  const ctx = await context();
  const hid = form.get('householdId');
  if (!ctx.memberships.some((x) => x.household_id === hid)) redirect('/today');
  (await cookies()).set('rehlatna-family', String(hid), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  revalidatePath('/', 'layout');
  redirect('/today');
}
export async function savePregnancy(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const due = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .safeParse(form.get('dueDate'));
  const name = z.string().trim().max(80).safeParse(form.get('babyName'));
  if (!due.success || !name.success) return bad;
  const date = new Date(due.data + 'T12:00:00Z');
  const delta = (date.valueOf() - Date.now()) / 86400000;
  if (
    !Number.isFinite(delta) ||
    date.toISOString().slice(0, 10) !== due.data ||
    delta < -14 ||
    delta > 294
  )
    return { error: 'راجع موعد الولادة المتوقع.' };
  const { data: existing, error: readError } = await ctx.client
    .from('pregnancies')
    .select('id')
    .eq('household_id', ctx.householdId)
    .is('birth_date', null)
    .limit(1);
  if (readError) return bad;
  const record = { due_date: due.data, baby_name: name.data || null };
  const result = existing?.[0]
    ? await ctx.client.from('pregnancies').update(record).eq('id', existing[0].id).select('id')
    : await ctx.client
        .from('pregnancies')
        .insert({ ...record, household_id: ctx.householdId })
        .select('id');
  if (result.error || !result.data?.length) return bad;
  revalidatePath('/today');
  redirect('/today');
}
export async function addAppointment(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const p = z
    .object({
      title: shortText,
      startsAt: z.string().datetime({ offset: true }),
      location: z.string().trim().max(200),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع عنوان الموعد والتاريخ والمكان.' };
  const { error } = await ctx.client
    .from('appointments')
    .insert({
      household_id: ctx.householdId,
      title: p.data.title,
      starts_at: p.data.startsAt,
      location: p.data.location,
    });
  if (error) return bad;
  revalidatePath('/journey');
  return { success: 'أُضيف الموعد إلى رحلتكم.' };
}
export async function addItem(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const title = shortText.safeParse(form.get('title'));
  if (!title.success) return bad;
  const { error } = await ctx.client
    .from('preparation_items')
    .insert({ household_id: ctx.householdId, title: title.data });
  if (error) return bad;
  revalidatePath('/preparation');
  return { success: 'أُضيف العنصر إلى القائمة.' };
}
export async function setItemStatus(form: FormData) {
  const ctx = await context();
  const p = z
    .object({ id: uuid, status: z.enum(['needed', 'ready', 'later']) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) throw new Error('بيانات غير صالحة');
  const { data, error } = await ctx.client
    .from('preparation_items')
    .update({ status: p.data.status })
    .eq('id', p.data.id)
    .eq('household_id', ctx.householdId)
    .select('id');
  if (error || !data?.length) throw new Error('تعذر تحديث العنصر');
  revalidatePath('/preparation');
}
export async function addPrivateRecord(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const p = z
    .object({
      kind: z.enum(['medical', 'finance']),
      title: shortText,
      body: z.string().trim().max(5000),
      amount: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return bad;
  const amount = p.data.kind === 'finance' ? Number(p.data.amount) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 999999999999))
    return { error: 'اكتب مبلغًا صحيحًا.' };
  const { error } = await ctx.client
    .from('private_records')
    .insert({ household_id: ctx.householdId, owner_id: ctx.current.id, ...p.data, amount });
  if (error) return bad;
  revalidatePath('/private');
  return { success: 'حُفظ السجل لك وحدك. يمكنك مشاركته من القائمة.' };
}
export async function shareRecord(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await context();
  const p = z
    .object({ recordId: uuid, recipientId: uuid, mode: z.enum(['share', 'revoke']) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return bad;
  const row = {
    household_id: ctx.householdId,
    record_id: p.data.recordId,
    recipient_id: p.data.recipientId,
  };
  const result =
    p.data.mode === 'share'
      ? await ctx.client.from('record_shares').insert(row)
      : await ctx.client.from('record_shares').delete().match(row).select('record_id');
  if (result.error || (p.data.mode === 'revoke' && !result.data?.length)) return bad;
  revalidatePath('/private');
  return { success: p.data.mode === 'share' ? 'مُنحت صلاحية المشاهدة.' : 'أُلغيت المشاركة.' };
}
