export const dynamic = 'force-dynamic';
import { Shell, PageTitle, Empty, Icon } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { addPrivateRecord, shareRecord } from '@/app/actions';
import { context } from '@/lib/supabase';
export default async function Private() {
  const ctx = await context();
  const [records, members, shares] = await Promise.all([
    ctx.client
      .from('private_records')
      .select('id,owner_id,kind,title,body,amount,currency')
      .eq('household_id', ctx.householdId)
      .order('created_at', { ascending: false }),
    ctx.client
      .from('memberships')
      .select('user_id,display_name')
      .eq('household_id', ctx.householdId)
      .eq('active', true),
    ctx.client
      .from('record_shares')
      .select('record_id,recipient_id')
      .eq('household_id', ctx.householdId),
  ]);
  if (records.error || members.error || shares.error) throw new Error('تعذر تحميل المساحة الخاصة');
  return (
    <Shell active="family">
      <PageTitle
        title="مساحتك الخاصة"
        description="أنت تختار ما تشاركه، ومع من. إدارة العائلة لا تمنح الاطلاع على هذه السجلات."
      />
      <div className="privacy-line">
        <Icon name="lock" />
        <span>المشاركة تمنح المشاهدة فقط. صاحب السجل يبقى المتحكم فيه.</span>
      </div>
      {!records.data.length ? (
        <Empty title="تفاصيل تحتفظ بها لنفسك">
          احفظ مبلغًا تخطط له، أو ملاحظة طبية خاصة. المشاركة اختيارية لكل سجل.
        </Empty>
      ) : (
        <div className="list">
          {records.data.map((r) => (
            <article className="card" key={r.id}>
              <div className="row">
                <span className="badge">{r.kind === 'finance' ? 'مالي' : 'طبي'}</span>
                <small>{r.owner_id === ctx.current.id ? 'سجل تملكه' : 'تمت مشاركته معك'}</small>
              </div>
              <h2>{r.title}</h2>
              {r.kind === 'finance' && (
                <bdi className="numeric">
                  {new Intl.NumberFormat('ar-SA', {
                    style: 'currency',
                    currency: r.currency,
                  }).format(Number(r.amount))}
                </bdi>
              )}
              <p style={{ whiteSpace: 'pre-wrap' }}>{r.body}</p>
              {r.owner_id === ctx.current.id && (
                <details>
                  <summary>من يشاهد هذا السجل؟</summary>
                  {shares.data
                    .filter((s) => s.record_id === r.id)
                    .map((s) => (
                      <ActionForm
                        key={s.recipient_id}
                        action={shareRecord}
                        label={
                          'إلغاء مشاركة ' +
                          (members.data.find((m) => m.user_id === s.recipient_id)?.display_name ??
                            'العضو')
                        }
                      >
                        <input type="hidden" name="recordId" value={r.id} />
                        <input type="hidden" name="recipientId" value={s.recipient_id} />
                        <input type="hidden" name="mode" value="revoke" />
                      </ActionForm>
                    ))}
                  {members.data.some(
                    (m) =>
                      m.user_id !== ctx.current.id &&
                      !shares.data.some(
                        (s) => s.record_id === r.id && s.recipient_id === m.user_id,
                      ),
                  ) ? (
                    <ActionForm action={shareRecord} label="مشاركة للمشاهدة">
                      <input type="hidden" name="recordId" value={r.id} />
                      <input type="hidden" name="mode" value="share" />
                      <label>
                        اختر الشخص
                        <select name="recipientId">
                          {members.data
                            .filter(
                              (m) =>
                                m.user_id !== ctx.current.id &&
                                !shares.data.some(
                                  (s) => s.record_id === r.id && s.recipient_id === m.user_id,
                                ),
                            )
                            .map((m) => (
                              <option key={m.user_id} value={m.user_id}>
                                {m.display_name}
                              </option>
                            ))}
                        </select>
                      </label>
                    </ActionForm>
                  ) : (
                    <small>لا يوجد عضو إضافي متاح للمشاركة.</small>
                  )}
                </details>
              )}
            </article>
          ))}
        </div>
      )}
      <section className="card">
        <h2>سجل خاص جديد</h2>
        <ActionForm
          action={addPrivateRecord}
          label="حفظ لي وحدي"
          disabled={ctx.membership.role === 'viewer'}
        >
          <label>
            نوع السجل
            <select name="kind">
              <option value="finance">تخطيط مالي</option>
              <option value="medical">ملاحظة طبية</option>
            </select>
          </label>
          <label>
            العنوان
            <input name="title" required maxLength={80} />
          </label>
          <label>
            المبلغ · للسجل المالي فقط
            <input
              name="amount"
              type="number"
              min="0"
              max="999999999999"
              step="0.01"
              defaultValue="0"
              dir="ltr"
            />
          </label>
          <label>
            التفاصيل
            <textarea name="body" maxLength={5000} />
          </label>
        </ActionForm>
        <small>
          المبالغ بالريال السعودي في هذه الدفعة. الملاحظات تحفظ ما تكتبه ولا تُفسّر أو تُشخّص طبيًا.
        </small>
      </section>
    </Shell>
  );
}
