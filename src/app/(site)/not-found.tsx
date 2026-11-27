import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: "center", maxWidth: 560 }}>
        <span className="eyebrow">Page not found</span>
        <h1>We couldn&apos;t find that page</h1>
        <p className="lead" style={{ margin: "0 auto 24px" }}>It may have moved. Try the home page, or chat with us on WhatsApp.</p>
        <Link className="btn btn-primary" href="/">Go to the home page</Link>
      </div>
    </section>
  );
}
