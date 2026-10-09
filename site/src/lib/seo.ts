import { PROFILE, SEO } from "./data";

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.name,
    jobTitle: PROFILE.role,
    url: `${PROFILE.url}/`,
    email: `mailto:${PROFILE.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
    sameAs: [PROFILE.linkedin, PROFILE.github],
    knowsAbout: SEO.knowsAbout,
  };
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" in values. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
