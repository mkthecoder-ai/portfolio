import type { ReactNode } from "react";
import type { SectionMeta } from "@/lib/types";
import { LineIcon } from "./LineIcon";

export function Section({ meta, children, className = "", titleClassName = "h2" }: {
  meta: SectionMeta; children?: ReactNode; className?: string; titleClassName?: string;
}) {
  return (
    <section id={meta.id} aria-labelledby={`${meta.id}-title`} className={`section ${className}`} data-stage={meta.stage}>
      <div className="container">
        {/* Spec 5.2: text sits on a translucent panel over the living background. */}
        <div className="sky-panel">
          <header className={`section-head reveal${meta.srOnlyTitle ? " section-head-compact" : ""}`}>
            {/* Spec 5.3: the label row: the section's icon, then its number and name. */}
            <p className="label section-label"><LineIcon name={meta.icon} size={22} className="section-icon" />{meta.index} / {meta.label}</p>
            <h2 id={`${meta.id}-title`} className={meta.srOnlyTitle ? "sr-only" : titleClassName}>{meta.title}</h2>
            {meta.lead ? <p className="lead-muted">{meta.lead}</p> : null}
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}
