import { Section } from "@/components/ui/Section";
import { PLAY, SECTIONS } from "@/lib/data";

/** Spec 5.0 section 7: side projects and experiments. */
export function Play() {
  return (
    <Section meta={SECTIONS.play}>
      <ul className="play-list">
        {PLAY.map((p) => (
          <li key={p.title} className="card play-item reveal">
            <h3 className="h3">{p.title}</h3>
            <p className="play-desc">{p.description}</p>
            <ul className="service-tags" aria-label={`${p.title}: tools`}>{p.tags.map((t) => <li key={t} className="tag">{t}</li>)}</ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
