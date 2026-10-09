import type { LogoSlug } from "./logos.generated";
import type { LineIconName } from "./line-icons";

export type IconRef = { brand: LogoSlug } | { line: LineIconName };

export interface Profile {
  name: string; handle: string; initials: string; role: string; positioning: string;
  email: string; linkedin: string; github: string; resumePath: string; url: string;
}
export interface NavItem { id: string; label: string }
/** `stage`: which of the six living-background stages (spec 5.2) the section sits in; `icon`: its label-row icon (spec 5.3). */
export interface SectionMeta { id: string; index: string; label: string; title: string; stage: number; icon: LineIconName; srOnlyTitle?: boolean; lead?: string }
/** `logos`: official marks from the logo sprite for the tools the service names (spec 5.3). */
export interface Capability { title: string; description: string; tags: string[]; logos: LogoSlug[] }
export interface StackItem { name: string; icon: IconRef; aliases?: string[] }
export interface StackGroup { id: string; title: string; items: StackItem[] }
export interface Role { title: string; period: string }
export interface TimelineStop { id: string; kind: "education" | "work"; period: string; heading: string; org: string; roles?: Role[]; bullets: string[] }
export type DiagramKind = "terraform" | "pipeline" | "cni" | "apim" | "aura";
export interface Constraints { status: "DRAFT" | "APPROVED"; items: string[] }
export interface WorkItem {
  id: string; index: string; kicker: string; title: string; summary: string;
  problem?: string; approach?: string; result?: string; whatItDoes?: string;
  constraints?: Constraints; stack: string[]; diagram: DiagramKind;
}
export interface Certification {
  /** Short label for the hero badge row. */
  badge: string;
  name: string; code: string; issuer: string;
  /** ISO dates from the issuer. */
  earned: string; expires?: string;
  verifyUrl: string;
  /** Small official earner badge, self-hosted under /badges. */
  image: { src: string; alt: string };
}
export interface Stat { prefix?: string; value: string; caption: string }
export interface ContactContent { heading: string; body: string }
export interface SeoContent { title: string; description: string; ogTitle: string; ogDescription: string; knowsAbout: string[] }
