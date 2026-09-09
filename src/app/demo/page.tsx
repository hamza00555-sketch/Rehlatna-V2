import Link from 'next/link';
import { EditorialArt } from '@/components/editorial-art';
import { BabyHero } from '@/components/baby-hero';
import { ReadinessRing } from '@/components/readiness-ring';
import { DangerSigns } from '@/components/sheet';
import { Shell, PageTitle, Icon, SectionHeading, PreparationSummary } from '@/components/ui';
export default async function Demo({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active = ['today', 'journey', 'preparation', 'family', 'more'].includes(tab ?? '')
    ? tab!
    : 'today';
  return (
    <Shell active={active} demo immersive={active === 'today'}>
      {active === 'today' ? (
        <>
          <BabyHero
            weeks={24}
            days={2}
            memberName="العائلة"
            demo
            dateIso={new Date().toISOString()}
          />
          <Link href="/demo?tab=journey" className="card scene-next-step detail-row">
            <span className="icon-tile">
              <Icon name="calendar" />
            </span>
            <span>
              <small>خطوة واحدة لليوم</small>
              <h2>ماذا نودّ أن نسأل الطبيب؟</h2>
              <p>نحفظ أسئلتنا الآن، ونذهب للموعد مطمئنين.</p>
            </span>
            <Icon name="arrow" />
          </Link>
          <SectionHeading title="يومكم، على مهل" subtitle="كل ما يهمكم في مكانه" />
          <div className="today-bento demo-scene-bento">
            <Link href="/demo?tab=journey" className="card medical today-appointment">
              <span className="icon-tile">
                <Icon name="calendar" />
              </span>
              <small>الموعد القادم · مثال</small>
              <h2>نطمئن على صغيرنا</h2>
              <p>متابعة الحمل مع الطبيب</p>
              <span className="card-action">
                تفاصيل الموعد <Icon name="arrow" />
              </span>
            </Link>
            <Link href="/demo?tab=journey" className="card journey-tile">
              <span className="icon-tile">
                <Icon name="journey" />
              </span>
              <small>أين نحن في الرحلة</small>
              <h2>منتصف الحكاية</h2>
              <p>نعيش الثلث الثاني</p>
              <span className="scene-path" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="card-action">
                محطاتكم القادمة <Icon name="arrow" />
              </span>
            </Link>
            <Link href="/demo/week?week=24" className="card today-development wide">
              <span className="icon-tile">
                <Icon name="leaf" />
              </span>
              <small>تطور الصغير</small>
              <h2>
                صغيركم يكبر.
                <br />
                واللقاء يقترب.
              </h2>
              <p>تعرّفوا على تطور صغيركم في الأسبوع 24، وما يهم في هذه المرحلة.</p>
              <span className="card-action">
                اكتشفوا هذا الأسبوع <Icon name="arrow" />
              </span>
            </Link>
            <Link href="/demo?tab=preparation" className="card ready today-readiness">
              <ReadinessRing ready={1} total={4} />
              <h2>
                نهيّئ مكانًا
                <br />
                للحياة الجديدة
              </h2>
              <p>1 من 4 متوفر · نحتاجه: 1</p>
              <span className="card-action">
                التجهيز على مهل <Icon name="arrow" />
              </span>
            </Link>
          </div>
          <DangerSigns />
          <div className="quiet-note">
            <Icon name="leaf" />
            <p>مو لازم نجهّز كل شيء اليوم. خطوة صغيرة تكفي.</p>
          </div>
        </>
      ) : active === 'journey' ? (
        <>
          <PageTitle
            eyebrow="من أول خبر إلى أول لقاء"
            title="كل محطة، حكاية"
            description="رحلة تجمع تفاصيلكم، وذكريات تبدأ من هنا."
          />
          <div className="journey-layout">
            <section className="timeline" aria-label="محطات توضيحية">
              {['أول زيارة للمتابعة', 'نطمئن ونكمل الرحلة', 'نستعد ليوم اللقاء'].map((title, i) => (
                <article className={'timeline-entry ' + (i === 1 ? 'current' : '')} key={title}>
                  <span className="timeline-point">
                    {i === 0 ? <Icon name="check" /> : <span className="numeric">0{i + 1}</span>}
                  </span>
                  <div className={'card ' + (i === 1 ? 'medical' : '')}>
                    <div className="row">
                      <span className="eyebrow">محطة توضيحية {i + 1}</span>
                      {i === 1 && <span className="badge">الخطوة التالية</span>}
                    </div>
                    <h2>{title}</h2>
                    <p>
                      {
                        [
                          'نحتفظ بالموعد، والمكان، والأسئلة التي نحب أن نسألها.',
                          'موعد جديد للاطمئنان، وتفاصيل نرتبها سويًا.',
                          'الأشياء الصغيرة تأخذ مكانها، واللقاء يقترب.',
                        ][i]
                      }
                    </p>
                  </div>
                </article>
              ))}
            </section>
            <aside className="journey-note">
              <EditorialArt kind="journey" compact caption="كل محطة تقرّبنا" />
              <Icon name="heart" />
              <h2>
                لسنا في سباق.
                <br />
                نعيشها يومًا بيوم.
              </h2>
              <p>مواعيدكم الفعلية تتبع خطة الطبيب، وتضيفونها معًا داخل رحلتكم.</p>
            </aside>
          </div>
        </>
      ) : active === 'preparation' ? (
        <>
          <PageTitle
            eyebrow="تفاصيل صغيرة، نجهّزها بحب"
            title="مكان لكل ما يحتاجه"
            description="نستفيد من الموجود، ونختار ما يناسب عائلتنا."
          />
          <PreparationSummary ready={1} total={4} />
          <EditorialArt kind="essentials" title="نهيّئ مكاناً للحياة الجديدة" priority />
          <SectionHeading title="قائمة الصغير" subtitle="أمثلة للتجهيز" />
          <div className="preparation-grid">
            {[
              ['moon', 'مكان النوم', 'جاهز', 'ركن هادئ ينتظر صغيركم'],
              ['preparation', 'مقعد السيارة', 'نحتاجه', 'لأول طريق إلى البيت'],
              ['clothes', 'ملابس الصغير', 'لاحقًا', 'قطع صغيرة، وفرحة كبيرة'],
              ['heart', 'حقيبة المستشفى', 'لاحقًا', 'نرتّبها قبل يوم اللقاء'],
            ].map(([icon, title, status, description], i) => (
              <article
                className={'card preparation-card with-photo ' + (i === 0 ? 'ready' : '')}
                key={title}
              >
                {i !== 1 && (
                  <EditorialArt
                    kind={i === 0 ? 'nursery' : i === 2 ? 'essentials' : 'bag'}
                    compact
                    caption="صورة توضيحية للفئة"
                  />
                )}
                <div className="row">
                  <span className="icon-tile">
                    <Icon name={icon} />
                  </span>
                  <span className={'badge status-' + i}>
                    {status === 'جاهز' && <Icon name="check" />}
                    {status}
                  </span>
                </div>
                <h2>{title}</h2>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <PageTitle
            eyebrow="الرحلة أجمل معًا"
            title="عائلتنا، ومساحة لكل واحد"
            description="لكل شخص حسابه. نشارك ما يجمعنا، ونحتفظ بما يخصّنا."
          />
          <section className="family-hero">
            <EditorialArt kind="journey" compact caption="مساحة تجمعكم" />
            <div className="family-emblem">
              <Icon name="family" />
            </div>
            <div>
              <span className="eyebrow">دائرة صغيرة، وحب كبير</span>
              <h2>
                أنت، وشريكك،
                <br />
                والحياة التي تنتظرونها.
              </h2>
              <p>دعوة واحدة تجمع حساباتكم في رحلة مشتركة.</p>
            </div>
          </section>
          <div className="bento family-cards">
            <article className="card">
              <span className="icon-tile">
                <Icon name="heart" />
              </span>
              <h2>ما يجمعنا</h2>
              <p>المواعيد، وتفاصيل الحمل، وقائمة تجهيز الصغير.</p>
              <span className="badge">متابعة مشتركة</span>
            </article>
            <article className="card private-card">
              <span className="icon-tile">
                <Icon name="lock" />
              </span>
              <h2>ما يخصّني</h2>
              <p>الملاحظات الطبية والمالية الخاصة. يشاركها صاحبها باختياره.</p>
              <span className="badge">المشاركة بقرارك</span>
            </article>
          </div>
          <p className="quiet-note">إدارة العائلة لا تمنح الوصول إلى السجلات الخاصة تلقائيًا.</p>
        </>
      )}
      <Link href="/auth" className="button demo-cta">
        نبدأ حكايتنا <Icon name="arrow" />
      </Link>
    </Shell>
  );
}
