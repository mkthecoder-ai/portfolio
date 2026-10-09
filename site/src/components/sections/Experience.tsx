import { Section } from "@/components/ui/Section";
import { SECTIONS, STATS, TIMELINE } from "@/lib/data";
import { vars } from "@/lib/style";

export function Experience() {
  return (
    <Section meta={SECTIONS.experience}>
      <ul className="stats">
        {STATS.map((s, i) => (
          <li key={s.caption} className="card stat reveal" style={vars({ "--i": i })}>
            <p className="stat-value mono">{s.prefix ? <span className="stat-prefix">{s.prefix} </span> : null}<span className="stat-number">{s.value}</span></p>
            <p className="label stat-caption">{s.caption}</p>
          </li>
        ))}
      </ul>
      <ol className="timeline">
        {TIMELINE.map((stop) => (
          <li key={stop.id} className="tl-stop reveal">
            <span className="tl-dot" aria-hidden="true" />
            <p className="label">{stop.period}</p>
            <h3 className="h3 tl-org">{stop.org}</h3>
            {stop.roles ? (
              <ul className="tl-roles">
                {stop.roles.map((r) => <li key={r.title}><span>{r.title}</span><span className="tl-role-period mono">{r.period}</span></li>)}
              </ul>
            ) : (
              <p className="tl-role">{stop.heading}</p>
            )}
            {stop.bullets.length > 0 ? <ul className="tl-bullets">{stop.bullets.map((b) => <li key={b}>{b}</li>)}</ul> : null}
          </li>
        ))}
      </ol>
    </Section>
  );
}
