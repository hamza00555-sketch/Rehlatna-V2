import Link from 'next/link';
import { productContext, records } from '@/lib/product-server';
import { careWindows, windowState, type WindowAppointment } from '@/lib/care-windows';
import { medicalDisclaimer } from '@/lib/product';
import { Sheet } from './sheet';
import { Badge, Select } from './product-ui';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
export async function CareWindows({ week }: { week: number }) {
  const ctx = await productContext();
  if (ctx.pregnancy?.birth_date || !ctx.can('appointments.view')) return null;
  const [appointments, registrations, details] = await Promise.all([
    records('appointments', 'appointments.view'),
    records('care_registrations', 'appointments.view'),
    records('mother_details', 'care.view'),
  ]);
  const windows = careWindows.filter((w) => !w.conditional || details[0]?.rh_negative);
  const upcoming = windows.find((w) => w.start > week);
  return (
    <section className="section-space">
      <h2>ما يهم في هذه المرحلة</h2>
      <p>
        جدول تنظيمي عام لحمل منخفض الخطورة، وليس بروتوكولاً طبياً موحّداً. طبيبكم قد يغيّر المواعيد
        والفحوصات حسب الحالة.
      </p>
      {windows.map((w) => {
        const reg = registrations.find((r) => r.window_key === w.key),
          state = windowState(
            w,
            week,
            reg?.status,
            appointments as WindowAppointment[],
            ctx.pregnancy.due_date,
          );
        if (state.hidden && !reg) return null;
        if (w.start > week && w.key !== upcoming?.key && !state.match) return null;
        if (reg && week > w.end + 4) return null;
        return (
          <Sheet
            key={w.key}
            title={w.title}
            trigger={
              <>
                <span>
                  {w.title}
                  <small>
                    الأسابيع {w.start}–{w.end}
                  </small>
                </span>
                <Badge tone={state.tone}>{state.label}</Badge>
              </>
            }
          >
            <Badge tone={state.tone}>{state.label}</Badge>
            <p>
              {state.label === 'لم يُسجَّل بعد'
                ? 'لم تسجّلوا إجراء هذا الفحص بعد. يمكن مناقشته مع طبيبكم في الزيارة القادمة.'
                : w.note}
            </p>
            {state.match && !state.match.window_key && w.kind !== 'follow' && (
              <p className="notice">
                لديكم موعد من هذا النوع في الفترة نفسها. إن كان هو، سجّلوا إجراءه هنا حتى لا نفترض
                ذلك عنكم.
              </p>
            )}
            {w.optional && <p>فحص اختياري. لا يوحي وجوده هنا بأنه مطلوب من كل حامل.</p>}
            {state.match && (
              <Link className="button secondary" href={'/journey/appointments/' + state.match.id}>
                عرض الموعد
              </Link>
            )}
            {ctx.can('appointments.edit') && (
              <>
                {!state.match && week >= w.start && state.label !== 'مسجَّل' && (
                  <Link
                    className="button"
                    href={`/journey/appointments/new?window=${w.key}&kind=${w.kind}`}
                  >
                    إضافة موعد
                  </Link>
                )}
                {week >= w.start && (
                  <ActionForm action={productAction} label={reg ? 'تحديث التسجيل' : 'حفظ التسجيل'}>
                    <input type="hidden" name="action" value="care-registration" />
                    <input type="hidden" name="window_key" value={w.key} />
                    <Select
                      name="status"
                      label="ما الذي تودون تسجيله؟"
                      options={{
                        done: 'سجّلنا إجراءه',
                        ...(w.kind === 'consultation' || w.optional
                          ? { discussed: 'ناقشناه مع الطبيب' }
                          : {}),
                        ...(w.optional || w.conditional ? { not_applicable: 'لا يناسبنا' } : {}),
                        ...(reg ? { remove: 'إلغاء التسجيل' } : {}),
                      }}
                      value={reg?.status ?? 'done'}
                    />
                  </ActionForm>
                )}
              </>
            )}
            <p className="notice">{medicalDisclaimer}</p>
            {w.source && (
              <a href={w.source} target="_blank" rel="noreferrer">
                المصدر الطبي
              </a>
            )}
          </Sheet>
        );
      })}
    </section>
  );
}
