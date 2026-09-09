import Link from 'next/link';
import { Shell, PageTitle, Icon, Empty } from '@/components/ui';
export default async function Demo({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active = ['today', 'journey', 'preparation', 'family'].includes(tab ?? '') ? tab! : 'today';
  return (
    <Shell active={active} demo>
      {active === 'today' ? (
        <>
          <PageTitle
            eyebrow="تجربة التصميم"
            title="كل يوم أقرب"
            description="هكذا تجتمع تفاصيل الرحلة في يومكما."
          />
          <section className="week-card">
            <span className="eyebrow">مثال توضيحي · ليس حسابًا لحملك</span>
            <div className="row">
              <div>
                <span className="week-number numeric">22</span>
                <p>أسبوعًا مكتملًا</p>
              </div>
              <h2>
                موعد صغير،
                <br />
                يغيّر كل شيء.
              </h2>
            </div>
            <div className="progress">
              <span style={{ width: '55%' }} />
            </div>
            <small>مشهد نمو الجنين يُضاف بعد اعتماد الصور المطابقة لكل مرحلة.</small>
          </section>
          <Link href="/demo?tab=journey" className="card medical">
            <span className="eyebrow">الخطوة التالية · مثال</span>
            <h2>نحضّر لموعد المتابعة</h2>
            <p>الموعد، المكان، وما نحتاج تذكّره.</p>
          </Link>
          <div className="bento">
            <Link href="/demo?tab=preparation" className="card ready">
              <Icon name="preparation" />
              <h3>التجهيز على مهل</h3>
              <p>خطوة صغيرة كل يوم</p>
            </Link>
            <Link href="/demo?tab=family" className="card">
              <Icon name="lock" />
              <h3>مساحة لكل واحد</h3>
              <p>مشاركة باختيارك</p>
            </Link>
          </div>
        </>
      ) : active === 'journey' ? (
        <>
          <PageTitle title="رحلتكم" description="كل محطة تقرّبنا من اللقاء." />
          {['أول زيارة للمتابعة', 'نتابع مع الطبيب', 'نستعد ليوم اللقاء'].map((s, i) => (
            <div className={'card ' + (i === 1 ? 'medical' : '')} key={s}>
              <span className="eyebrow">محطة توضيحية {i + 1}</span>
              <h2>{s}</h2>
              <p>المواعيد الفعلية يضيفها أفراد العائلة حسب خطة الطبيب.</p>
            </div>
          ))}
        </>
      ) : active === 'preparation' ? (
        <>
          <PageTitle title="التجهيز على مهل" description="نبدأ بالموجود، ثم نكمّل الناقص." />
          <div className="bento">
            {[
              ['مكان النوم', 'جاهز'],
              ['مقعد السيارة', 'نحتاجه'],
              ['ملابس الصغير', 'نراجع الموجود'],
              ['حقيبة المستشفى', 'لاحقًا'],
            ].map(([title, status]) => (
              <article key={title} className={'card ' + (status === 'جاهز' ? 'ready' : '')}>
                <Icon name="preparation" />
                <h3>{title}</h3>
                <span className="badge">{status}</span>
              </article>
            ))}
          </div>
          <small>هذه قائمة للمعاينة فقط. عائلتك تبدأ بقائمة خاصة بها.</small>
        </>
      ) : (
        <>
          <PageTitle title="عائلتنا" description="حسابات مستقلة ومساحة تجمعكم." />
          <div className="card warm">
            <Icon name="family" />
            <h2>أنت وشريكك</h2>
            <p>دعوة واحدة تربط الحسابين، وكل شخص يحتفظ بخصوصيته.</p>
          </div>
          <Empty title="المشاركة قرار صاحب المعلومة">
            إدارة العائلة لا تفتح السجلات المالية والطبية الخاصة تلقائيًا.
          </Empty>
        </>
      )}
      <Link href="/auth" className="button">
        إنشاء رحلتنا
      </Link>
    </Shell>
  );
}
