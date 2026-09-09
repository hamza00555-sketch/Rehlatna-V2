'use server';
import { z } from 'zod';
import { careWindows } from '@/lib/care-windows';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { db, requireUser } from '@/lib/supabase';
import { productContext } from '@/lib/product-server';
import {
  categories,
  statuses,
  appointmentKinds,
  doctorRoles,
  stages,
  priorities,
  taskKinds,
  isoToday,
} from '@/lib/product';
import type { FormState } from './actions';
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const n = new Date(v + 'T12:00:00Z');
    return Number.isFinite(+n) && n.toISOString().slice(0, 10) === v;
  });
const uuid = z.string().uuid();
export async function finishOnboarding(_: FormState, f: FormData): Promise<FormState> {
  const p = z
    .object({
      family_name: z.string().trim().min(1).max(40),
      member_name: z.string().trim().min(1).max(80),
      member_role: z.enum(['mother', 'partner', 'supporter']),
      due_date: date,
      follow_city: z.string().trim().min(1).max(100),
      birth_city: z.string().trim().min(1).max(100),
      partner_name: z.string().trim().max(80),
    })
    .safeParse(Object.fromEntries(f));
  if (!p.success) return { error: 'راجعوا الأسماء والمدن وموعد الوصول.' };
  await requireUser();
  const client = await db();
  const { data, error } = await client.rpc('complete_onboarding', {
    ...p.data,
    finance_enabled: f.get('finance_enabled') === 'on',
  });
  if (error) return { error: 'لم تُحفظ الرحلة. راجعوا البيانات وحاولوا مرة أخرى.' };
  (await cookies()).set('rehlatna-family', data, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  redirect('/today');
}
export async function productAction(_: FormState, f: FormData): Promise<FormState> {
  const ctx = await productContext();
  let next = '';
  const str = (name: string, max = 5000) =>
    z
      .string()
      .trim()
      .max(max)
      .parse(String(f.get(name) ?? ''));
  const required = (name: string, max = 120) =>
    z.string().trim().min(1).max(max).parse(f.get(name));
  const choose = (name: string, options: Record<string, string>) =>
    z.enum(Object.keys(options) as [string, ...string[]]).parse(f.get(name));
  const id = () => uuid.parse(f.get('id'));
  const optionalId = (name: string) => (f.get(name) ? uuid.parse(f.get(name)) : null);
  const day = (name: string) => date.parse(f.get(name));
  const optionalDay = (name: string) => (f.get(name) ? day(name) : null);
  const cents = (name: string, optional = false) => {
    const value = str(name, 20);
    if (optional && !value) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(value)) throw Error('amount');
    const n = Math.round(Number(value) * 100);
    if (!Number.isSafeInteger(n) || n > 999999999999) throw Error('amount');
    return n;
  };
  const need = (p: Parameters<typeof ctx.can>[0]) => {
    if (!ctx.can(p)) throw Error('permission');
  };
  const check = async (result: PromiseLike<{ error: unknown; data?: unknown }>, rows = false) => {
    const r = await result;
    if (r.error || (rows && (!Array.isArray(r.data) || !r.data.length))) throw Error('save');
    return r.data as Record<string, unknown>[];
  };
  const update = async (table: string, row: Record<string, unknown>, key = 'id', value = id()) =>
    check(
      ctx.client
        .from(table)
        .update(row)
        .eq('household_id', ctx.householdId)
        .eq(key, value)
        .select(key),
      true,
    );
  const insert = async (table: string, row: Record<string, unknown>) =>
    check(
      ctx.client
        .from(table)
        .insert({ ...row, household_id: ctx.householdId })
        .select('*'),
      true,
    );
  const remove = async (table: string) => {
    if (f.get('confirm') !== 'on') throw Error('confirm');
    await check(
      ctx.client
        .from(table)
        .delete()
        .eq('household_id', ctx.householdId)
        .eq('id', id())
        .select('id'),
      true,
    );
  };
  try {
    switch (f.get('action')) {
      case 'item': {
        need('preparation.edit');
        const row = {
          title: required('title'),
          category: choose('category', categories),
          status: choose('status', statuses),
          item_type: choose('item_type', { large: '', small: '' }),
          hospital_bag: f.get('hospital_bag') === 'on',
          notes: str('notes'),
        };
        if (f.get('id')) {
          await update('preparation_items', row);
          next = '/preparation/item/' + id();
        } else {
          const r = await insert('preparation_items', row);
          next = '/preparation/item/' + r[0].id;
        }
        break;
      }
      case 'item-status':
        need('preparation.edit');
        await update('preparation_items', { status: choose('status', statuses) });
        break;
      case 'item-delete':
        need('preparation.edit');
        await remove('preparation_items');
        next = '/preparation';
        break;
      case 'seed': {
        need('preparation.edit');
        const existing = await ctx.client
          .from('preparation_items')
          .select('id')
          .eq('household_id', ctx.householdId)
          .limit(1);
        if (existing.error || existing.data?.length) throw Error('already');
        const seeds = [
          ['سرير الصغير', 'sleep', 'large'],
          ['أغطية قطنية', 'sleep', 'small'],
          ['عربة الأطفال', 'transport', 'large'],
          ['مقعد السيارة', 'transport', 'large'],
          ['مستلزمات الرضاعة', 'feeding', 'small'],
          ['ملابس حديثي الولادة', 'clothes', 'small'],
          ['بطانية خفيفة', 'clothes', 'small'],
          ['حفاضات حديثي الولادة', 'care', 'small'],
          ['مستلزمات الاستحمام والعناية', 'care', 'small'],
          ['حقيبة المستشفى', 'hospital', 'large'],
          ['الهوية وبطاقة التأمين وملف المتابعة', 'hospital', 'small'],
          ['مستلزمات الأم بعد الولادة', 'mother', 'small'],
        ];
        await check(
          ctx.client.from('preparation_items').insert(
            seeds.map(([title, category, item_type]) => ({
              household_id: ctx.householdId,
              title,
              category,
              item_type,
              status: 'later',
              hospital_bag: category === 'hospital',
            })),
          ),
        );
        break;
      }
      case 'appointment': {
        need('appointments.edit');
        const kind = choose('kind', appointmentKinds),
          d = day('date'),
          time = str('time', 5);
        if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error('time');
        const row = {
          title: appointmentKinds[kind as keyof typeof appointmentKinds],
          kind,
          starts_at: new Date(`${d}T${time || '12:00'}:00+03:00`).toISOString(),
          has_time: Boolean(time),
          city: str('city', 100),
          location: str('location', 200),
          doctor_id: optionalId('doctor_id'),
          hospital_id: optionalId('hospital_id'),
          notes: str('notes'),
          steps: str('steps', 4000)
            .split('\n')
            .filter((x) => x.trim())
            .slice(0, 40)
            .map((title) => ({ title: title.slice(0, 160), done: false })),
          reminder: f.get('reminder') === 'on',
        };
        if (row.hospital_id) {
          const p = await ctx.client
            .from('providers')
            .select('city,kind')
            .eq('id', row.hospital_id)
            .eq('household_id', ctx.householdId)
            .single();
          if (p.error || p.data.kind !== 'hospital') throw Error('hospital');
          row.city = p.data.city;
        }
        if (f.get('id')) {
          const old = await ctx.client
            .from('appointments')
            .select('steps')
            .eq('id', id())
            .eq('household_id', ctx.householdId)
            .single();
          if (old.error) throw Error('read');
          row.steps = row.steps.map((s) => ({
            ...s,
            done:
              (old.data.steps as { title: string; done: boolean }[]).find(
                (o) => o.title === s.title,
              )?.done ?? false,
          }));
          await update('appointments', row);
          next = '/journey/appointments/' + id();
        } else {
          const r = await insert('appointments', {
            ...row,
            window_key: str('window_key', 80) || null,
          });
          next = '/journey/appointments/' + r[0].id;
        }
        break;
      }
      case 'appointment-status': {
        need('appointments.edit');
        const status = choose('status', { completed: '', cancelled: '' });
        if (status === 'cancelled' && f.get('confirm') !== 'on') throw Error('confirm');
        await check(
          ctx.client.rpc('set_appointment_status', {
            hid: ctx.householdId,
            aid: id(),
            new_status: status,
          }),
        );
        break;
      }
      case 'appointment-step': {
        need('appointments.edit');
        const index = z.coerce.number().int().min(0).max(39).parse(f.get('index'));
        await check(
          ctx.client.rpc('toggle_appointment_step', {
            hid: ctx.householdId,
            aid: id(),
            step_index: index,
            is_done: f.get('done') === 'true',
          }),
        );
        break;
      }
      case 'milestone': {
        need('journey.edit');
        const r = await insert('milestones', {
          title: required('title', 160),
          event_date: day('event_date'),
          kind: choose('kind', {
            manual: '',
            family: '',
            travel: '',
            preparation: '',
            medical: '',
          }),
          description: str('description'),
        });
        next = '/journey/milestone/' + r[0].id;
        break;
      }
      case 'milestone-delete':
        need('journey.edit');
        await remove('milestones');
        next = '/journey';
        break;
      case 'ultrasound': {
        need('appointments.edit');
        const row = {
          scan_date: day('scan_date'),
          week: f.get('week') ? z.coerce.number().int().min(0).max(44).parse(f.get('week')) : null,
          notes: str('notes'),
        };
        if (f.get('id')) await update('ultrasounds', row);
        else {
          const r = await insert('ultrasounds', {
            ...row,
            appointment_id: optionalId('appointment_id'),
          });
          next = '/journey/ultrasound/' + r[0].id;
        }
        break;
      }
      case 'provider': {
        need('care.edit');
        const kind = choose('kind', { doctor: '', hospital: '', insurance: '' });
        const website = str('website', 500);
        if (website && !/^https?:\/\//.test(website)) throw Error('url');
        const row = {
          name: required('name'),
          city: str('city', 100),
          phone: str('phone', 40),
          website,
          doctor_role: str('doctor_role', 20) || 'follow',
          specialty: str('specialty', 120),
          purposes: f.getAll('purposes').map(String),
          coverage: str('coverage', 30) || 'unknown',
          program: str('program', 120),
          notes: str('notes'),
        };
        const result = await ctx.client.rpc('save_provider', {
          hid: ctx.householdId,
          pid: optionalId('id'),
          value: { ...row, kind },
          linked_hospitals: f
            .getAll('linked_hospitals')
            .filter(Boolean)
            .map((v) => uuid.parse(v)),
        });
        if (result.error || !result.data) throw Error('save');
        next = `/more/providers/${kind}/${result.data}`;
        break;
      }
      case 'provider-delete':
        need('care.edit');
        await remove('providers');
        next = '/more/providers';
        break;
      case 'verify-provider':
        need('care.edit');
        await update('providers', {
          coverage: choose('coverage', {
            unknown: '',
            believed_included: '',
            believed_excluded: '',
          }),
          last_verified: isoToday(),
        });
        break;
      case 'verification-task':
        need('care.edit');
        await insert('verification_tasks', { provider_id: id(), title: required('title', 160) });
        break;
      case 'verification-done':
        need('care.edit');
        await update('verification_tasks', { done: f.get('done') === 'true' });
        break;
      case 'birth-plan':
        need('care.edit');
        await check(
          ctx.client.rpc('save_care_plan', {
            hid: ctx.householdId,
            section: 'birth',
            value: {
              hospital_id: optionalId('hospital_id'),
              doctor_id: optionalId('doctor_id'),
              insurance_id: optionalId('insurance_id'),
              support: str('support', 300),
              preferences: str('preferences'),
            },
          }),
        );
        break;
      case 'travel-step':
        need('care.edit');
        await check(
          ctx.client.rpc('toggle_travel_step', {
            hid: ctx.householdId,
            step_index: z.coerce.number().int().min(0).max(39).parse(f.get('index')),
            is_done: f.get('done') === 'true',
          }),
        );
        break;
      case 'travel':
        need('care.edit');
        await check(
          ctx.client.rpc('save_care_plan', {
            hid: ctx.householdId,
            section: 'travel',
            value: {
              travel_from: required('travel_from', 100),
              travel_to: required('travel_to', 100),
              move_date: optionalDay('move_date'),
              return_date: optionalDay('return_date'),
              travel_steps: str('travel_steps', 4000)
                .split('\n')
                .filter(Boolean)
                .slice(0, 40)
                .map((title) => ({ title: title.slice(0, 160), done: false })),
              travel_notes: str('travel_notes'),
            },
          }),
        );
        break;
      case 'feeding':
        need('care.edit');
        await check(
          ctx.client.rpc('save_care_plan', {
            hid: ctx.householdId,
            section: 'feeding',
            value: {
              feeding: f.getAll('feeding').map(String),
              feeding_notes: str('feeding_notes'),
            },
          }),
        );
        break;
      case 'care-registration': {
        need('appointments.edit');
        const key = required('window_key', 80),
          w = careWindows.find((w) => w.key === key),
          status = str('status', 30);
        if (
          !w ||
          ctx.pregnancy?.birth_date ||
          !['done', 'discussed', 'not_applicable', 'remove'].includes(status)
        )
          throw Error('window');
        if (status === 'not_applicable' && !w.optional && !w.conditional) throw Error('optional');
        await check(
          ctx.client.rpc('register_care_window', {
            hid: ctx.householdId,
            wkey: key,
            new_status: status,
          }),
        );
        break;
      }
      case 'rh':
        need('care.edit');
        await check(
          ctx.client.rpc('set_rh_negative', {
            hid: ctx.householdId,
            value: f.get('rh_negative') === 'on',
          }),
        );
        break;
      case 'baby-name':
        need('journey.edit');
        if (!ctx.pregnancy) throw Error('pregnancy');
        await update(
          'pregnancies',
          { baby_name: str('baby_name', 60) || null },
          'id',
          ctx.pregnancy.id,
        );
        next = '/more/baby';
        break;
      case 'baby-sex':
        need('journey.edit');
        if (!ctx.pregnancy) throw Error('pregnancy');
        await update(
          'pregnancies',
          { sex: choose('sex', { female: '', male: '', unknown: '', undisclosed: '' }) },
          'id',
          ctx.pregnancy.id,
        );
        next = '/journey';
        break;
      case 'birth': {
        need('journey.edit');
        if (f.get('confirm') !== 'on' || !ctx.pregnancy) throw Error('confirm');
        await check(
          ctx.client.rpc('confirm_birth', {
            hid: ctx.householdId,
            pid: ctx.pregnancy.id,
            born_on: day('birth_date'),
            born_at: str('birth_time', 5) || null,
            child_name: str('baby_name', 60) || null,
            child_sex: choose('sex', { female: '', male: '', unknown: '', undisclosed: '' }),
          }),
        );
        next = '/journey/birth/confirmed';
        break;
      }
      case 'postpartum-task':
        need('care.edit');
        if (!ctx.pregnancy?.birth_date) throw Error('birth');
        await insert('postpartum_tasks', {
          title: required('title', 160),
          kind: choose('kind', taskKinds),
          task_date: optionalDay('task_date'),
        });
        break;
      case 'postpartum-done':
        need('care.edit');
        await update('postpartum_tasks', { done: f.get('done') === 'true' });
        break;
      case 'postpartum-delete':
        need('care.edit');
        await remove('postpartum_tasks');
        break;
      case 'member':
        need('family.manage');
        await check(
          ctx.client.rpc('update_member_permissions', {
            hid: ctx.householdId,
            uid: id(),
            new_roles: f.getAll('roles').map(String),
            overrides: JSON.parse(required('overrides', 4000)),
          }),
        );
        break;
      case 'profile':
        need('family.manage');
        await check(
          ctx.client.rpc('update_household_profile', {
            hid: ctx.householdId,
            new_name: required('name', 40),
            follow_city: required('follow_city', 100),
            birth_city: required('birth_city', 100),
            currency: required('currency', 3).toUpperCase(),
          }),
        );
        break;
      case 'preferences': {
        const theme = choose('theme', { system: '', light: '', dark: '' }),
          reduce_motion = f.get('reduce_motion') === 'on';
        await check(
          ctx.client.rpc('save_preferences', { new_theme: theme, motion: reduce_motion }),
        );
        (await cookies()).set('rehlatna-theme', theme, {
          sameSite: 'lax',
          path: '/',
          maxAge: 31536000,
        });
        (await cookies()).set('rehlatna-motion', reduce_motion ? 'reduce' : 'full', {
          sameSite: 'lax',
          path: '/',
          maxAge: 31536000,
        });
        break;
      }
      case 'finance-enable':
        need('family.manage');
        await check(ctx.client.rpc('initialize_finance', { hid: ctx.householdId }));
        break;
      case 'finance-settings':
        await check(
          ctx.client.rpc('update_finance_settings', {
            hid: ctx.householdId,
            is_enabled: f.get('enabled') === 'on',
            is_shared: f.get('shared') === 'on',
          }),
        );
        break;
      case 'goal': {
        need('finance.edit');
        need('finance.view');
        const row = {
          title: required('title', 160),
          expected_cents: cents('expected'),
          funding_date: day('funding_date'),
          spending_date: optionalDay('spending_date'),
          priority: choose('priority', priorities),
          stage: choose('stage', stages),
          visibility: choose('visibility', { private: '', shared: '' }),
          notes: str('notes'),
        };
        if (f.get('id')) {
          if (f.get('confirm') !== 'on') throw Error('confirm');
          await update('finance_goals', { ...row, actual_cents: cents('actual', true) });
          next = '/finance/goals/' + id();
        } else {
          const r = await insert('finance_goals', {
            ...row,
            initial_cents: cents('initial'),
            owner_id: ctx.current.id,
            item_id: optionalId('item_id'),
          });
          next = '/finance/goals/' + r[0].id;
        }
        break;
      }
      case 'contribution':
        need('finance.edit');
        await insert('finance_contributions', {
          goal_id: id(),
          amount_cents: cents('amount'),
          contributed_on: day('contributed_on'),
          note: str('note', 1000),
          created_by: ctx.current.id,
        });
        break;
      case 'goal-delete':
        need('finance.edit');
        await remove('finance_goals');
        next = '/finance';
        break;
      case 'reset':
        if (f.get('confirm') !== 'on') throw Error('confirm');
        await check(
          ctx.client.rpc('delete_household', { hid: ctx.householdId, confirmation: 'DELETE' }),
        );
        next = '/setup';
        break;
      default:
        throw Error('unknown');
    }
  } catch {
    return { error: 'لم يُحفظ التغيير. راجعوا البيانات والصلاحيات ثم حاولوا مرة أخرى.' };
  }
  revalidatePath('/', 'layout');
  if (next) redirect(next);
  return { success: 'تم الحفظ' };
}
