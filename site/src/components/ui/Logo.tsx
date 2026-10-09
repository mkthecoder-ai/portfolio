import type { LogoSlug } from "@/lib/logos.generated";

/** A brand logo from /logos/sprite.svg (one cached file), so pages don't carry path data twice (HTML + RSC payload). */
export function Logo({ slug, label, className = "" }: { slug: LogoSlug; label?: string; className?: string }) {
  return (
    <span className={`logo ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg fill="currentColor" aria-hidden="true" focusable="false"><use href={`/logos/sprite.svg#logo-${slug}`} /></svg>
    </span>
  );
}
