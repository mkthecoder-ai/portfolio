import { PROFILE, REPO_PUBLIC, REPO_URL } from "@/lib/data";

const now = new Date();
const updated = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(now);

export function Footer() {
  return (
    <footer className="site-footer" data-stage={6}>
      <div className="container">
        <div className="sky-panel">
          <p className="footer-wordmark" aria-hidden="true">{PROFILE.name}</p>
          {/* LinkedIn, GitHub and the résumé live in Contact only (spec 5.5): the footer keeps the credits. */}
          <div className="footer-meta mono">
            <p className="footer-row">
              <span>© {now.getFullYear()} {PROFILE.name}</span>
              <span>Built with Azure Static Web Apps and Terraform</span>
              {REPO_PUBLIC ? <a href={REPO_URL} className="hit"><span className="link">Source</span></a> : null}
            </p>
            <p className="footer-row">
              <span>Last updated {updated}</span>
              <a href="#home" className="hit"><span className="link">Back to top</span></a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
