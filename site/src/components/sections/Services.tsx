import { Logo } from "@/components/ui/Logo";
import { Section } from "@/components/ui/Section";
import { CAPABILITIES, SECTIONS } from "@/lib/data";
import { vars } from "@/lib/style";

export function Services() {
  return (
    <Section meta={SECTIONS.services}>
      <ul className="services">
        {CAPABILITIES.map((c, i) => (
          <li key={c.title} className="card service reveal" style={vars({ "--i": i % 3 })}>
            <div className="service-top">
              <span className="label">{String(i + 1).padStart(2, "0")}</span>
              {/* Spec 5.3: official marks for the tools named below (decorative: the tags carry the names). */}
              <span className="service-logos">{c.logos.map((slug) => <Logo key={slug} slug={slug} className="service-logo" />)}</span>
            </div>
            <h3 className="h3 service-title">{c.title}</h3>
            <p className="service-desc">{c.description}</p>
            <ul className="service-tags" aria-label={`${c.title}: tools`}>{c.tags.map((t) => <li key={t} className="tag">{t}</li>)}</ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
