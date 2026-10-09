import { Section } from "@/components/ui/Section";
import { SECTIONS, WORK } from "@/lib/data";
import { oneLiner } from "@/lib/derive";
import { vars } from "@/lib/style";

export function Work() {
  return (
    <Section meta={SECTIONS.work}>
      <ol className="work-list">
        {WORK.map((w, i) => (
          <li key={w.id} id={`work-${w.id}`} className="work-row grid-12 reveal" style={vars({ "--i": i })}>
            <span className="work-index mono">{w.index}</span>
            <div className="work-main">
              <h3 className="h3">{w.title}</h3>
              <p className="work-problem">{oneLiner(w)}</p>
            </div>
            <ul className="work-tags" aria-label={`${w.title}: stack`}>
              {w.stack.map((t) => <li key={t} className="tag">{t}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}
