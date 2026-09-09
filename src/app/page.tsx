import Link from 'next/link';
import { Brand, Icon, NurseryImage } from '@/components/ui';
export default function Welcome() {
  return (
    <div className="welcome-page">
      <header className="top">
        <Brand />
        <span className="brand-caption">معًا، من أول خبر إلى أول لقاء</span>
        <Link href="/auth" className="header-login">
          دخول العائلة <Icon name="arrow" />
        </Link>
      </header>
      <main>
        <div className="landing">
          <section className="landing-copy">
            <span className="eyebrow">
              <span className="small-dot" /> بداية حكايتكم الأجمل
            </span>
            <h1>
              حياة صغيرة.
              <br />
              <em>حبّ كبير.</em>
              <br />
              ورحلة تجمعكم.
            </h1>
            <p>
              للأيام التي تنتظرونها، والتفاصيل التي تحبّونها. مساحة لكما لمتابعة الحمل، وتجهيز
              الصغير، ومشاركة هذه الرحلة… على مهلكم.
            </p>
            <div className="landing-actions">
              <Link href="/auth" className="button">
                لنبدأ رحلتنا <Icon name="arrow" />
              </Link>
              <Link href="/demo" className="text-link">
                خذ جولة في التطبيق
              </Link>
            </div>
            <div className="privacy-line">
              <Icon name="lock" />
              <span>حساب لكل شخص، ومساحة خاصة تبقى باختياره.</span>
            </div>
          </section>
          <aside className="landing-art">
            <NurseryImage priority />
            <span className="art-label">
              <Icon name="heart" /> ننتظرك بكل الحب
            </span>
            <div className="art-note">
              <span className="eyebrow">لأجمل ما هو قادم</span>
              <p>
                نُهيّئ لك مكانًا،
                <br />
                وأنت تملأ حياتنا.
              </p>
              <span className="art-note-line" />
            </div>
          </aside>
        </div>
        <section className="welcome-features" aria-label="مساحات رحلتنا">
          {[
            ['journey', '01', 'الأيام تصبح حكاية', 'موعدكم القادم ومحطات الرحلة، في مكان واحد.'],
            [
              'preparation',
              '02',
              'نجهّز بحبّ، وعلى مهل',
              'من أول غرض إلى حقيبة اللقاء، نرتّبها معًا.',
            ],
            ['family', '03', 'معًا، ولكل واحد مساحته', 'رحلة مشتركة وخصوصية يحددها صاحب المعلومة.'],
          ].map(([icon, n, title, description]) => (
            <article key={icon}>
              <div className="row">
                <span className="icon-tile">
                  <Icon name={icon} />
                </span>
                <span className="feature-index numeric">{n}</span>
              </div>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="footer">
        <span>رحلتنا · تفاصيل صغيرة تستحق الاهتمام.</span>
        <span>للمتابعة والتنظيم، ولا يغني عن الرعاية الطبية.</span>
      </footer>
    </div>
  );
}
