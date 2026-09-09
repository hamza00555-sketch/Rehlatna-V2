import Link from 'next/link';
import { Brand, Icon } from '@/components/ui';
export default function Welcome() {
  return (
    <>
      <header className="top">
        <Brand />
        <Link href="/auth" className="text-link">
          دخول العائلة
        </Link>
      </header>
      <main className="landing">
        <section className="landing-copy">
          <span className="eyebrow">من أول خبر… إلى أول لقاء</span>
          <h1>
            حياة صغيرة.
            <br />
            رحلة تجمعكم.
          </h1>
          <p>
            كل تفاصيل هذه المرحلة، في مكان هادئ لكما. نتابع الأيام، نجهّز الصغير، ونترك مساحة لما
            يستحق أن يبقى خاصًا.
          </p>
          <Link href="/auth" className="button">
            لنبدأ رحلتنا
          </Link>
          <Link href="/demo" className="text-link">
            خذ جولة في التطبيق
          </Link>
          <div className="privacy-line">
            <Icon name="lock" />
            <span>حساب لكل شخص. رحلة مشتركة. وخصوصية يحددها صاحبها.</span>
          </div>
        </section>
        <aside className="landing-art">
          <Brand />
          <blockquote>
            نرتّب التفاصيل الصغيرة،
            <br />
            ونترك مكانًا للفرحة.
          </blockquote>
          <div className="welcome-lines">
            <span>
              <Icon name="journey" />
              أيام ومحطات نتذكرها
            </span>
            <span>
              <Icon name="preparation" />
              تجهيز على مهل
            </span>
            <span>
              <Icon name="family" />
              كل واحد له دوره ومساحته
            </span>
          </div>
        </aside>
      </main>
      <footer className="footer">رحلتنا · متابعة وتنظيم، ولا يغني عن الرعاية الطبية.</footer>
    </>
  );
}
