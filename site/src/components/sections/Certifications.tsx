import { LineIcon } from "@/components/ui/LineIcon";
import { Section } from "@/components/ui/Section";
import { CERTIFICATIONS, IN_PROGRESS, SECTIONS } from "@/lib/data";
import { yearEarned } from "@/lib/derive";
import { vars } from "@/lib/style";

/** Spec 3.1: name (code), issuer · year earned, the official badge (128px; 96px on phones, spec 5.3) and a Verify link. */
export function Certifications() {
  return (
    <Section meta={SECTIONS.certifications}>
      <ol className="certs">
        {CERTIFICATIONS.map((c, i) => (
          <li key={c.code} className="cert-row reveal" style={vars({ "--i": i })}>
            <span className="cert-index mono">{String(i + 1).padStart(2, "0")}</span>
            {/* Plain <img>: the badges are pre-sized static files, and next/image would add client JS to a static export. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cert-badge" src={c.image.src} alt={c.image.alt} width={128} height={128} loading="lazy" decoding="async" />
            <span className="cert-main">
              <span className="cert-name">{c.name} <span className="cert-code">({c.code})</span></span>
              <span className="cert-meta mono">{c.issuer} · {yearEarned(c)}</span>
            </span>
            <a href={c.verifyUrl} className="hit cert-verify mono" target="_blank" rel="noopener noreferrer">
              <span className="link">Verify</span><span className="sr-only"> {c.name} ({c.code}), opens in a new tab</span>
              <LineIcon name="arrowUpRight" size={14} />
            </a>
          </li>
        ))}
        <li className="cert-row cert-progress reveal" style={vars({ "--i": CERTIFICATIONS.length })}>
          <span className="cert-index" aria-hidden="true" />
          <span className="cert-badge" aria-hidden="true" />
          <span className="cert-main"><span className="label">In progress</span><span className="cert-progress-text">{IN_PROGRESS}</span></span>
        </li>
      </ol>
    </Section>
  );
}
