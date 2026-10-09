import { Section } from "@/components/ui/Section";
import { ABOUT, PROFILE, SECTIONS } from "@/lib/data";

const AVATAR_WIDTHS = [320, 480, 640];
const srcSet = (ext: string) => AVATAR_WIDTHS.map((w) => `/about/avatar-${w}.${ext} ${w}w`).join(", ");
const SIZES = "(min-width: 768px) 240px, 200px";

/** Spec 5.3: the approved illustrated bust (scripts/build-avatar.mjs) beside the About text; above it on phones. */
export function About() {
  return (
    <Section meta={SECTIONS.about}>
      <div className="about-grid">
        <picture className="about-avatar reveal">
          <source type="image/avif" srcSet={srcSet("avif")} sizes={SIZES} />
          {/* Plain <img>: pre-sized static files; next/image would add client JS to a static export. */}
          <img src="/about/avatar-480.webp" srcSet={srcSet("webp")} sizes={SIZES} width={480} height={596}
            alt={`${PROFILE.name}, illustrated`} loading="lazy" decoding="async" />
        </picture>
        <div className="about-text">
          {ABOUT.map((p, i) => <p key={i} className="lead reveal">{p}</p>)}
        </div>
      </div>
    </Section>
  );
}
