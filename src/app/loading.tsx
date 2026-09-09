export default function Loading() {
  return (
    <main className="skeleton-layout" aria-busy="true">
      <p role="status">نحضّر تفاصيل رحلتكم…</p>
      <div className="skeleton hero" />
      <div className="skeleton" />
      <div className="product-grid">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton row" />
      <div className="skeleton row" />
    </main>
  );
}
