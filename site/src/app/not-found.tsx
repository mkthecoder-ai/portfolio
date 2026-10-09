/* eslint-disable @next/next/no-html-link-for-pages -- a 404 should reload home as a full document: next/link
   would add ~3.6 kB of router JS to every page (the root not-found boundary ships with each route). */
export default function NotFound() {
  return (
    <main id="main" className="container notfound">
      <a href="/" className="brand" aria-label="mkthecoder.com home"><span className="monogram" aria-hidden="true">MK</span></a>
      <div className="notfound-body">
        <p className="label">404 / Not found</p>
        <h1 className="hero-name">This page doesn&apos;t exist.</h1>
        <p className="lead-muted">The link may be old or mistyped.</p>
        <a href="/" className="btn btn-primary notfound-cta">Back to mkthecoder.com</a>
      </div>
    </main>
  );
}
