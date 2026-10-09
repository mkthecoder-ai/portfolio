import { Monogram } from "@/components/ui/Monogram";
import { CERTIFICATIONS, PROFILE } from "@/lib/data";
import { vars } from "@/lib/style";

export function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="hero">
      <div className="container grid-12 hero-grid">
        <div className="hero-copy">
          <p className="label" data-hero-item style={vars({ "--i": 0 })}>{PROFILE.role}</p>
          <h1 id="hero-title" className="hero-name" data-hero-item style={vars({ "--i": 1 })}>{PROFILE.name}</h1>
          <p className="hero-positioning" data-hero-item style={vars({ "--i": 2 })}>{PROFILE.positioning}</p>
          <div className="hero-ctas" data-hero-item style={vars({ "--i": 3 })}>
            <a href="#work" className="btn btn-primary">View work</a>
            <a href={`mailto:${PROFILE.email}`} className="btn btn-secondary">Email me</a>
          </div>
          <ul className="hero-badges" aria-label="Certifications" data-hero-item style={vars({ "--i": 4 })}>
            {CERTIFICATIONS.map((c) => <li key={c.code} className="tag">{c.badge}</li>)}
          </ul>
        </div>
        <div className="hero-visual" data-hero-item style={vars({ "--i": 1 })}>
          <Monogram initials={PROFILE.initials} className="hero-mark" />
        </div>
      </div>
    </section>
  );
}
