import { describe, it, expect } from "vitest";
import {
  ABOUT, ALL_WORK, AURA_CLEANROOM_CONFIRMED, CAPABILITIES, CERTIFICATIONS, CONTACT, IN_PROGRESS, NAV,
  NON_STACK_TERMS, PROFILE, SECTIONS, SECTION_ORDER, SEO, STACK_GROUPS, STATS, TIMELINE, WORK,
} from "./data";
import { oneLiner, stackItemFor, unknownWorkTerms, usedIn, yearEarned } from "./derive";
import { LINE_ICONS } from "./line-icons";
import { LOGOS } from "./logos.generated";

const visible = JSON.stringify({ PROFILE, ABOUT, CAPABILITIES, STACK_GROUPS, TIMELINE, WORK, CERTIFICATIONS, IN_PROGRESS, STATS, CONTACT, SEO, SECTIONS });
const all = JSON.stringify({ visible, ALL_WORK });
const item = (name: string) => STACK_GROUPS.flatMap((g) => g.items).find((i) => i.name === name)!;
const EMPLOYERS = /CNH|Unified Softech|Cubespace/i;

describe("copy rules", () => {
  it("never states a number of years", () => expect(all).not.toMatch(/\b\d+\s*\+?\s*(years?|yrs?)\b/i));
  it("uses no em dashes", () => expect(all).not.toContain("—"));
  it("has no availability wording", () => expect(all).not.toMatch(/open to (work|remote|new conversations)|availab/i));
  it("uses the mkthecoder LinkedIn URL only", () => {
    expect(PROFILE.linkedin).toBe("https://www.linkedin.com/in/mkthecoder");
    expect(all).not.toContain("linkedin.com/in/manojkumarm0107");
  });
  it("contains no phone number", () => {
    const runs = all.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
    expect(runs.filter((r) => r.replace(/\D/g, "").length >= 10)).toEqual([]);
  });
  it("keeps the hero positioning to tagline B", () => {
    expect(PROFILE.positioning).toBe("Secure, automated Azure platforms, from Terraform to production.");
  });
  it("keeps About to three sentences at most, in two or three short paragraphs", () => {
    expect(ABOUT.join(" ").split(/(?<=[.!?])\s+/).filter(Boolean).length).toBeLessThanOrEqual(3);
    expect(ABOUT.length).toBeGreaterThanOrEqual(2);
    expect(ABOUT.length).toBeLessThanOrEqual(3);
  });
  it("keeps the approved About wording (only split into paragraphs)", () => {
    expect(ABOUT.join(" ")).toBe("I started in DevOps in 2018, building Azure infrastructure and CI/CD for client projects, and I've moved steadily closer to the platform itself. Today I work across the full lifecycle of production Azure platforms: AKS clusters, reusable Terraform modules, pipelines with enforced security gates, API Management and monitoring. Two things matter to me more than any single tool: making the secure path the easy path, and leaving systems simpler than I found them.");
  });
  it("serves the résumé from its public file name", () => expect(PROFILE.resumePath).toBe("/Manoj_Kumar_M_Resume.pdf"));
});

describe("structure", () => {
  it("navigates to Work, About and Play (spec 5.0; Resume is the button)", () => {
    expect(NAV.map((n) => n.label)).toEqual(["Work", "About", "Play"]);
  });
  it("labels all eight home sections in order (spec 5.0 adds Play)", () => {
    expect(SECTION_ORDER.map((id) => `${SECTIONS[id].index} / ${SECTIONS[id].label}`)).toEqual([
      "01 / Work", "02 / About", "03 / Play", "04 / Services", "05 / Stack", "06 / Experience", "07 / Certifications", "08 / Contact",
    ]);
  });
});

describe("stats", () => {
  it("shows exactly 'Since 2018' and '3 certifications', consistent with the data", () => {
    expect(STATS.map((s) => `${s.prefix ? `${s.prefix} ` : ""}${s.value} ${s.caption}`)).toEqual(["Since 2018 Building on Azure", "3 Certifications"]);
    expect(Number(STATS[1].value)).toBe(CERTIFICATIONS.length);
  });
});

describe("work", () => {
  it("keeps AURA off the site until Manoj confirms in writing", () => {
    expect(AURA_CLEANROOM_CONFIRMED).toBe(false);
    expect(ALL_WORK.some((w) => w.id === "aura")).toBe(true);
    expect(WORK.some((w) => w.id === "aura")).toBe(false);
  });
  it("gives every pattern a one-line problem", () => {
    for (const w of WORK) {
      expect(oneLiner(w), w.id).toMatch(/[.]$/);
      expect(oneLiner(w).split(/(?<=[.!?])\s+/).length, w.id).toBe(1);
    }
  });
  it("drafts 2-4 generic constraints per pattern, all still DRAFT, with no employer facts", () => {
    for (const w of ALL_WORK.filter((x) => x.id !== "aura")) {
      expect(w.constraints?.status, w.id).toBe("DRAFT");
      expect(w.constraints!.items.length, w.id).toBeGreaterThanOrEqual(2);
      expect(w.constraints!.items.length, w.id).toBeLessThanOrEqual(4);
      for (const c of w.constraints!.items) expect(c, w.id).not.toMatch(EMPLOYERS);
    }
  });
  it("names employers only in the Experience timeline", () => {
    const outsideExperience = JSON.stringify({ PROFILE, ABOUT, CAPABILITIES, STACK_GROUPS, ALL_WORK, CERTIFICATIONS, STATS, CONTACT, SEO });
    expect(outsideExperience).not.toMatch(EMPLOYERS);
  });
});

describe("derived lookups (kept for v1.1)", () => {
  it("maps Terraform to the two patterns that use it", () => expect(usedIn(item("Terraform"), WORK).map((w) => w.id)).toEqual(["terraform", "cni"]));
  it("matches aliases", () => expect(usedIn(item("API Management"), WORK).map((w) => w.id)).toEqual(["apim"]));
  it("knows every work stack term", () => expect(unknownWorkTerms(STACK_GROUPS, ALL_WORK, NON_STACK_TERMS)).toEqual([]));
  it("finds a stack item for a work term", () => expect(stackItemFor("Azure", STACK_GROUPS)?.name).toBe("Microsoft Azure"));
});

describe("section labels (spec 5.3)", () => {
  it("gives every section one line icon from the existing set, all different", () => {
    const icons = SECTION_ORDER.map((id) => SECTIONS[id].icon);
    for (const i of icons) expect(Object.keys(LINE_ICONS)).toContain(i);
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe("services (spec 5.3)", () => {
  it("keeps all six services with their wording", () => {
    expect(CAPABILITIES.map((c) => c.title)).toEqual(["Azure Cloud & API Management", "Kubernetes Platforms", "Infrastructure as Code", "CI/CD Engineering", "DevSecOps", "Observability & Cost"]);
  });
  it("shows only official marks from the logo sprite, each the mark of a tool the service names", () => {
    for (const c of CAPABILITIES) {
      // The marks the service's own words point to, through the stack's names and aliases.
      const named = [...c.tags, ...c.title.split(/\s*&\s*|\s+/)].map((t) => stackItemFor(t, STACK_GROUPS)?.icon)
        .flatMap((i) => (i && "brand" in i ? [i.brand] : []));
      expect(c.logos.length, c.title).toBeGreaterThan(0);
      for (const slug of c.logos) {
        expect(Object.keys(LOGOS), `${c.title}: ${slug}`).toContain(slug);
        expect(named, `${c.title} names a tool with the ${slug} mark`).toContain(slug);
      }
    }
  });
});

describe("experience", () => {
  it("describes CNH in the public résumé's capability wording, with no internal projects or migrations", () => {
    const cnh = TIMELINE.find((s) => s.id === "cnh")!.bullets;
    expect(cnh).toEqual([
      "Build and operate production AKS clusters: provisioning, upgrades, node pools, autoscaling, isolation and hardening.",
      "Develop reusable Terraform modules for Azure using Azure Verified Modules (AVM), with a multi-state layout that separates networking, clusters and shared services.",
      "Design CI/CD pipelines in Azure DevOps and GitLab CI with reusable templates and enforced security gates for code, dependency and container image scanning.",
      "Manage Azure API Management (APIM): policies, backends, API lifecycle and automated OpenAPI publishing through pipelines.",
      "Implement private networking with VNets, peering, private endpoints and private DNS for platform services.",
      "Run observability with Azure Monitor, Prometheus, Grafana and Datadog.",
    ]);
    expect(cnh.join(" ")).not.toMatch(/\bmove\b|migrat|incident|\d+\s*%/i);
  });
  it("runs oldest first and ends at CNH with both titles", () => {
    expect(TIMELINE.map((s) => s.org)).toEqual(["Don Bosco Institute of Technology, Bengaluru", "Cubespace Technologies", "Unified Softech", "CNH Industrial"]);
    expect(TIMELINE[3].roles?.map((r) => r.title)).toEqual(["Software Engineer II, DevOps & Platform Engineering", "Software Engineer I, DevOps Engineering"]);
  });
});

describe("certifications (verified from the issuers)", () => {
  it("lists the three certifications with the years they were earned", () => {
    expect(CERTIFICATIONS.map((c) => `${c.badge} ${yearEarned(c)}`)).toEqual(["AZ-104 2026", "Terraform Associate 2025", "AZ-900 2023"]);
  });
  it("uses the verified names and the verification links Manoj supplied", () => {
    expect(CERTIFICATIONS.map((c) => `${c.name} (${c.code})`)).toEqual([
      "Microsoft Certified: Azure Administrator Associate (AZ-104)",
      "HashiCorp Certified: Terraform Associate (003)",
      "Microsoft Certified: Azure Fundamentals (AZ-900)",
    ]);
    expect(CERTIFICATIONS[1].verifyUrl).toBe("https://www.credly.com/badges/5bb7c69e-706c-42e1-a0b4-23b5f54f7950/public_url");
    for (const c of CERTIFICATIONS) expect(new URL(c.verifyUrl).host).toMatch(/^(learn\.microsoft\.com|www\.credly\.com)$/);
  });
  it("shows a small self-hosted official badge for each", () => {
    for (const c of CERTIFICATIONS) expect(c.image.src).toMatch(/^\/badges\/[a-z0-9-]+\.(svg|webp)$/);
  });
  it("names the certification in progress", () => expect(IN_PROGRESS).toBe("Certified Kubernetes Administrator (CKA)"));
});
