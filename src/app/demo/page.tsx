import Link from 'next/link';
import {
  Shell,
  PageTitle,
  Icon,
  PregnancyHero,
  SectionHeading,
  PreparationSummary,
  NurseryImage,
} from '@/components/ui';
export default async function Demo({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active = ['today', 'journey', 'preparation', 'family'].includes(tab ?? '') ? tab! : 'today';
  return (
    <Shell active={active} demo>
      {active === 'today' ? (
        <>
          <PageTitle
            eyebrow="أيام صغيرة، وفرحة تكبر"
            title="صباح الخير، يا أهل الحكاية"
            description="هذه مساحتكم. نرتّب التفاصيل ونترك مكانًا للفرحة."
          />
          <PregnancyHero weeks={22} demo />
          <SectionHeading title="تفاصيل يومكم" subtitle="على مهلكم، خطوة بخطوة" />
          <div className="today-grid">
            <Link href="/demo?tab=journey" className="card medical appointment-card card-link">
              <div className="row">
                <span className="icon-tile">
                  <Icon name="calendar" />
                </span>
                <span className="badge">الموعد القادم · مثال</span>
              </div>
              <h2>نطمئن على صغيرنا</h2>
              <p>متابعة الحمل مع الطبيب</p>
              <div className="appointment-footer">
                <span>الموعد والمكان وتفاصيل الزيارة</span>
                <Icon name="arrow" />
              </div>
            </Link>
            <div className="bento">
              <Link href="/demo?tab=preparation" className="card ready feature-card">
                <span className="icon-tile">
                  <Icon name="preparation" />
                </span>
                <h3>التجهيز على مهل</h3>
                <p>شيء صغير نجهّزه بحب</p>
                <span className="card-action">
                  قائمة الصغير <Icon name="arrow" />
                </span>
              </Link>
              <Link href="/demo?tab=family" className="card private-card feature-card">
                <span className="icon-tile">
                  <Icon name="lock" />
                </span>
                <h3>قريبون، وبخصوصية</h3>
                <p>لكل واحد مساحته</p>
                <span className="card-action">
                  مساحة العائلة <Icon name="arrow" />
                </span>
              </Link>
            </div>
          </div>
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
          <SectionHeading title="قائمة الصغير" subtitle="أمثلة للتجهيز" />
          <div className="preparation-grid">
            {[
              ['moon', 'مكان النوم', 'جاهز', 'ركن هادئ ينتظر صغيركم'],
              ['preparation', 'مقعد السيارة', 'نحتاجه', 'لأول طريق إلى البيت'],
              ['clothes', 'ملابس الصغير', 'لاحقًا', 'قطع صغيرة، وفرحة كبيرة'],
              ['heart', 'حقيبة المستشفى', 'لاحقًا', 'نرتّبها قبل يوم اللقاء'],
            ].map(([icon, title, status, description], i) => (
              <article
                className={'card preparation-card ' + (i === 0 ? 'ready with-photo' : '')}
                key={title}
              >
                {i === 0 && (
                  <div className="preparation-photo">
                    <NurseryImage />
                  </div>
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
