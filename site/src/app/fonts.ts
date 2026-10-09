import localFont from "next/font/local";

/**
 * Geist Mono, as the geist package declares it but without the preload: it only sets small labels and tags,
 * and preloading its 70 kB file competed with the document and Geist Sans on slow mobile connections.
 */
export const GeistMono = localFont({
  src: "../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Roboto Mono", "Menlo", "Monaco", "Liberation Mono", "DejaVu Sans Mono", "Courier New", "monospace"],
  weight: "100 900",
});
