'use client';
import { useState, useActionState } from 'react';
import { finishOnboarding } from '@/app/product-actions';
import { Brand } from './ui';
import { roleNames, shiftDate, isoToday } from '@/lib/product';
export function Onboarding() {
  const [step, setStep] = useState(1),
    [due, setDue] = useState(''),
    [name, setName] = useState(''),
    [role, setRole] = useState('mother'),
    [partner, setPartner] = useState(true),
    [partnerName, setPartnerName] = useState(''),
    [finance, setFinance] = useState(false),
    [city, setCity] = useState(''),
    [same, setSame] = useState(true),
    [birthCity, setBirthCity] = useState(''),
    [title, setTitle] = useState(''),
    [state, submit, pending] = useActionState(finishOnboarding, {});
  const elapsed = due
    ? Math.max(0, 280 - Math.round((Date.parse(due) - Date.parse(isoToday())) / 86400000))
    : 0;
  const valid =
    step === 2
      ? !!due
      : step === 3
        ? !!name.trim() && (!partner || !!partnerName.trim())
        : step === 5
          ? !!city.trim() && (same || !!birthCity.trim())
          : true;
  return (
    <main className="focused-page">
      <Brand />
      <div className="onboarding-dots" aria-label={`الخطوة ${step} من 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} data-active={i <= step} />
        ))}
      </div>
      <small>الخطوة {step} من 5</small>
      <form action={submit} className="form">
        <fieldset disabled={pending}>
          <input type="hidden" name="family_name" value={title.trim() || 'رحلتنا'} />
          <input type="hidden" name="member_name" value={name} />
          <input type="hidden" name="member_role" value={role} />
          <input type="hidden" name="due_date" value={due} />
          <input type="hidden" name="follow_city" value={city} />
          <input type="hidden" name="birth_city" value={same ? city : birthCity} />
          <input type="hidden" name="partner_name" value={partner ? partnerName : ''} />
          {finance && <input type="hidden" name="finance_enabled" value="on" />}
          {step === 1 && (
            <section className="story-panel">
              <div className="story-orbit" />
              <h1>رحلة واحدة تعيشونها معاً</h1>
              <p>الأسابيع، المواعيد، التجهيز، والوصول — في مكان واحد يخصّكم.</p>
            </section>
          )}
          {step === 2 && (
            <>
              <h1>متى موعد الوصول المتوقع؟</h1>
              <p>التاريخ الذي حدده طبيبكم. يمكن تعديله لاحقاً، وسنوضّح أثره على الأسبوع المعروض.</p>
              <label>
                موعد الوصول المتوقع
                <input
                  type="date"
                  min={isoToday()}
                  max={shiftDate(isoToday(), 294)}
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  required
                />
              </label>
              {due && (
                <div className="card warm">
                  أنتم الآن في الأسبوع {Math.floor(elapsed / 7)}، اليوم {(elapsed % 7) + 1}
                </div>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h1>من يشارككم الرحلة؟</h1>
              <p>أضيفوا الأسماء كما تحبون أن تظهر في التطبيق.</p>
              <label>
                اسمك
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </label>
              <label>
                دورك
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {(['mother', 'partner', 'supporter'] as const).map((k) => (
                    <option key={k} value={k}>
                      {roleNames[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle-row">
                إضافة شريك
                <input
                  type="checkbox"
                  checked={partner}
                  onChange={(e) => setPartner(e.target.checked)}
                />
              </label>
              {partner ? (
                <>
                  <label>
                    اسم الشريك
                    <input
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      maxLength={80}
                    />
                  </label>
                  <small>بعد الإعداد يمكنكم دعوته ببريده ليشارك بحسابه الخاص.</small>
                </>
              ) : (
                <p>سأضيف الشريك لاحقاً</p>
              )}
            </>
          )}
          {step === 4 && (
            <>
              <h1>التخطيط المالي</h1>
              <p>طبقة اختيارية لتنظيم مصاريف الوصول.</p>
              <div className="notice">
                الحمل بيانات حساسة. نجمع فقط ما يساعد على المتابعة والتخطيط والتنسيق مع الرعاية
                الصحية.
              </div>
              <label className="toggle-row">
                تفعيل التخطيط المالي
                <input
                  type="checkbox"
                  checked={finance}
                  onChange={(e) => setFinance(e.target.checked)}
                />
              </label>
              {finance && (
                <section className="story-panel">
                  <h2>خاصة بحساب {name}</h2>
                  <p>
                    الأسعار والمدّخرات لا تُرسل لبقية الأعضاء. يمكنك منح صلاحية المالية بعد انضمام
                    الشريك بحسابه.
                  </p>
                </section>
              )}
            </>
          )}
          {step === 5 && (
            <>
              <h1>أين المتابعة؟ وأين الولادة؟</h1>
              <p>قد تختلف مدينة المتابعة عن مدينة الولادة، ولهذا نحفظهما منفصلتين.</p>
              <label>
                مدينة المتابعة
                <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
              </label>
              <label className="toggle-row">
                نفس مدينة المتابعة
                <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} />
              </label>
              {!same && (
                <label>
                  مدينة الولادة
                  <input
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                    maxLength={100}
                  />
                </label>
              )}
              <label>
                اسم رحلتكم في التطبيق · اختياري
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
              </label>
            </>
          )}
          <div className="step-nav">
            {step > 1 && (
              <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
                رجوع
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                className="button"
                disabled={!valid}
                onClick={() => setStep(step + 1)}
              >
                متابعة
              </button>
            ) : (
              <button className="button" disabled={!valid || pending}>
                {pending ? 'نجهّز رحلتكم…' : 'ابدؤوا الرحلة'}
              </button>
            )}
          </div>
        </fieldset>
        {state.error && (
          <p role="alert" className="notice error">
            {state.error}
          </p>
        )}
      </form>
    </main>
  );
}
