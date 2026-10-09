import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { SECTIONS, STACK_GROUPS } from "@/lib/data";
import { vars } from "@/lib/style";

/** Grouped stack chips: plain logo + name, server-rendered (spec 3.1: no "Used in" pop-ups in v1). */
export function Stack() {
  return (
    <Section meta={SECTIONS.stack}>
      <div className="stack-groups">
        {STACK_GROUPS.map((group, gi) => (
          <div key={group.id} role="group" aria-labelledby={`stack-${group.id}`} className="stack-group reveal" style={vars({ "--i": gi % 4 })}>
            <h3 id={`stack-${group.id}`} className="label">{group.title}</h3>
            <ul className="stack-chips">
              {group.items.map((item) => (
                <li key={item.name} className="chip"><span className="chip-icon"><Icon icon={item.icon} size={16} /></span>{item.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
