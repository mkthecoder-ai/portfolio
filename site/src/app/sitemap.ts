import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Home only in v1; the pattern pages arrive in v1.1. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://mkthecoder.com/", lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
