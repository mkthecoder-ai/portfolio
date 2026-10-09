import { HERO_STATIC, hasHeroStatic } from "@/lib/assets";
import { CERTIFICATIONS, HEADLINE, PROFILE } from "@/lib/data";
import { vars } from "@/lib/style";
import { DuskMotion } from "./DuskMotion";
import { PaintedScene } from "./PaintedScene";

/** A 1×1 transparent GIF: what the live tier "loads" instead of the static image (no request). */
const NOTHING = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Spec 5.0/5.1: the dusk hero, with the painted layers (PaintedScene). Text is HTML and paints first. Wide screens with motion and JS get the layered live
 * scene; phones, reduced motion and no-JS get one static composed image of the same scene.
 */
export function DuskHero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="dusk" data-stage={1}>
      <div className="dusk-stage">
        {hasHeroStatic() ? (
          <picture className="dusk-static">
            <source media="(min-width: 768px) and (prefers-reduced-motion: no-preference) and (scripting: enabled)" srcSet={NOTHING} />
            <source media="(min-width: 768px)" srcSet={HERO_STATIC.wide} width={1440} height={900} />
            <img src={HERO_STATIC.tall} alt="" width={720} height={900} fetchPriority="high" decoding="async" />
          </picture>
        ) : null}
        <div className="dusk-scene" aria-hidden="true">
          <PaintedScene />
          <canvas className="packets" />
        </div>
        <div className="dusk-shade" aria-hidden="true" />
        <div className="container dusk-copy">
          <div className="dusk-panel">
            {/* Spec 5.3: the name is the H1 and the largest text; the designation, then the tagline. The last word
                never wraps alone ("Kumar M" stays together). */}
            <h1 id="hero-title" className="dusk-name" data-hero-item style={vars({ "--i": 0 })}>{PROFILE.name.replace(/ (\S{1,2})$/, "\u00a0$1") /* keeps a trailing initial off a line of its own */}</h1>
            <p className="dusk-role" data-hero-item style={vars({ "--i": 1 })}>{PROFILE.role}</p>
            <p className="dusk-tagline dusk-headline" data-hero-item style={vars({ "--i": 2 })}>
              {HEADLINE.line.split(/(?<=\.)\s+/).map((sentence) => <span key={sentence} className="dusk-line">{sentence} </span>)}
            </p>
            <p className="dusk-sub" data-hero-item style={vars({ "--i": 2 })}>{HEADLINE.sub}</p>
            <div className="hero-ctas" data-hero-item style={vars({ "--i": 3 })}>
              <a href="#work" className="btn btn-primary">View work</a>
              <a href={`mailto:${PROFILE.email}`} className="btn btn-secondary dusk-btn">Email me</a>
            </div>
            <ul className="hero-badges" aria-label="Certifications" data-hero-item style={vars({ "--i": 4 })}>
              {CERTIFICATIONS.map((c) => <li key={c.code} className="tag dusk-tag">{c.badge}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <DuskMotion />
    </section>
  );
}
