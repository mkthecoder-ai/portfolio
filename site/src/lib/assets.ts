import { existsSync } from "node:fs";
import { join } from "node:path";
import { PROFILE } from "./data";

// Build-time checks of files in site/public (server components only).
const PUBLIC = join(process.cwd(), "public");

export const hasResume = () => existsSync(join(PUBLIC, PROFILE.resumePath));

/** Spec 5.0 section 9: the static composed hero (phones, reduced motion, no JS), rendered by scripts/build-hero-static.mjs. */
export const HERO_STATIC = { wide: "/hero/dusk-16x10.webp", tall: "/hero/dusk-4x5.webp" };
export const hasHeroStatic = () => existsSync(join(PUBLIC, HERO_STATIC.wide)) && existsSync(join(PUBLIC, HERO_STATIC.tall));
