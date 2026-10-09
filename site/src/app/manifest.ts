import type { MetadataRoute } from "next";
import { PROFILE } from "@/lib/data";

export const dynamic = "force-static";

/** Spec 5.2: the installable icon set (scripts/build-icons.mjs). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PROFILE.name,
    short_name: "mkthecoder",
    start_url: "/",
    display: "browser",
    background_color: "#120f2e",
    theme_color: "#120f2e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
