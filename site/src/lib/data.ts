import brand from "./brand.json";
import type {
  Capability, Certification, ContactContent, NavItem, Profile, SectionMeta, SeoContent, Stat, StackGroup, TimelineStop, WorkItem,
} from "./types";

/** Flip to true only after Manoj confirms in writing that the public AURA was built independently
 *  of any employer code, data or internal requirements (spec, section 2). */
export const AURA_CLEANROOM_CONFIRMED = false;

/** True shows a "Source" link to this repository in the footer. */
export const REPO_PUBLIC = false;
export const REPO_URL = "https://github.com/mkthecoder-ai/portfolio";

export const PROFILE: Profile = {
  name: brand.name,
  handle: brand.handle,
  initials: brand.initials,
  role: brand.role,
  positioning: brand.positioning,
  email: "manojkumarm0107@gmail.com",
  linkedin: "https://www.linkedin.com/in/mkthecoder",
  github: "https://github.com/mkthecoder-ai",
  resumePath: "/Manoj_Kumar_M_Resume.pdf",
  url: brand.url,
};

/** The header links (spec 3.1): four sections plus the Resume button. */
/** Spec 5.0 section 7: Work, About, Play, plus the Resume button. */
export const NAV: NavItem[] = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "play", label: "Play" },
];

/** Every home section, in page order. */
export const SECTION_ORDER = ["work", "about", "play", "services", "stack", "experience", "certifications", "contact"] as const;

export const OBSERVED_SECTION_IDS = ["home", ...SECTION_ORDER];

export const SECTIONS: Record<string, SectionMeta> = {
  work: { id: "work", icon: "terminal", stage: 2, index: "01", label: "Work", title: "Selected work" },
  about: { id: "about", icon: "id", stage: 3, index: "02", label: "About", title: "About", srOnlyTitle: true },
  play: { id: "play", icon: "sparkle", stage: 3, index: "03", label: "Play", title: "Side projects and experiments" },
  services: { id: "services", icon: "cluster", stage: 4, index: "04", label: "Services", title: "What I do" },
  stack: { id: "stack", icon: "modules", stage: 4, index: "05", label: "Stack", title: "Tech stack", lead: "Grouped by area and ordered by depth." },
  experience: { id: "experience", icon: "briefcase", stage: 5, index: "06", label: "Experience", title: "Experience" },
  certifications: { id: "certifications", icon: "award", stage: 5, index: "07", label: "Certifications", title: "Certifications" },
  contact: { id: "contact", icon: "mail", stage: 6, index: "08", label: "Contact", title: "Let's talk" },
};

/** Spec 5.0 section 7. AURA, the homelab and tools join once Manoj supplies them (AURA only when clean-room). */
export const PLAY = [
  {
    title: "This site",
    description: "A static Next.js site on Azure Static Web Apps, provisioned with Terraform and gated in CI: accessibility, Lighthouse, bundle budgets and link checks run on every change.",
    tags: ["Next.js", "Terraform", "Azure Static Web Apps", "GitHub Actions"],
  },
];

/** Spec 5.1: the hero headline (Manoj's pick). */
/** In brand.json so the OG image (scripts/build-og.mjs) uses the same words. */
export const HEADLINE = { line: brand.headline, sub: brand.subline };

/** Spec 5.3: the approved wording, in three short paragraphs. */
export const ABOUT = [
  "I started in DevOps in 2018, building Azure infrastructure and CI/CD for client projects, and I've moved steadily closer to the platform itself.",
  "Today I work across the full lifecycle of production Azure platforms: AKS clusters, reusable Terraform modules, pipelines with enforced security gates, API Management and monitoring.",
  "Two things matter to me more than any single tool: making the secure path the easy path, and leaving systems simpler than I found them.",
];

export const CAPABILITIES: Capability[] = [
  { title: "Azure Cloud & API Management", description: "Landing zones, networking and identity across subscriptions, with API Management in front of microservices.", tags: ["VNets", "Private Endpoints", "DNS", "Entra ID", "APIM"], logos: ["azure"] },
  { title: "Kubernetes Platforms", description: "AKS clusters designed, upgraded, scaled and hardened for production, with workloads shipped through Helm.", tags: ["AKS", "Helm", "Dapr", "HPA", "Cilium"], logos: ["kubernetes", "helm", "dapr", "cilium"] },
  { title: "Infrastructure as Code", description: "Reusable Terraform modules and multi-state layouts that make infrastructure changes safe and reviewable.", tags: ["Terraform", "AVM", "ARM"], logos: ["terraform"] },
  { title: "CI/CD Engineering", description: "Pipelines that build, test, scan and release across environments, built from shared templates.", tags: ["Azure DevOps", "GitLab CI", "Jenkins"], logos: ["azuredevops", "gitlab", "jenkins"] },
  { title: "DevSecOps", description: "Security built into delivery: scanning as a gate, hardened images, secrets out of code, least-privilege access.", tags: ["SonarCloud", "Trivy", "JFrog Xray", "Key Vault"], logos: ["sonarqubecloud", "trivy", "jfrog"] },
  { title: "Observability & Cost", description: "Dashboards and alerts that surface issues early, and cloud spend that stays under control.", tags: ["Azure Monitor", "Prometheus", "Grafana", "Datadog"], logos: ["prometheus", "grafana", "datadog"] },
];

export const STACK_GROUPS: StackGroup[] = [
  { id: "cloud", title: "Cloud", items: [
    { name: "Microsoft Azure", icon: { brand: "azure" }, aliases: ["Azure"] },
    { name: "AKS", icon: { line: "cluster" } },
    { name: "App Services", icon: { line: "app" } },
    { name: "Virtual Machines", icon: { line: "server" } },
    { name: "Function Apps", icon: { line: "bolt" } },
    { name: "Storage Accounts", icon: { line: "database" } },
    { name: "Azure Container Registry", icon: { line: "box" } },
    { name: "API Management", icon: { line: "api" }, aliases: ["Azure API Management"] },
    { name: "Service Bus", icon: { line: "exchange" } },
    { name: "Key Vault", icon: { line: "key" } },
    { name: "Entra ID", icon: { line: "id" } },
    { name: "PostgreSQL", icon: { brand: "postgresql" } },
    { name: "Redis", icon: { brand: "redis" } },
    { name: "Azure OpenAI", icon: { line: "sparkle" } },
  ] },
  { id: "containers", title: "Containers", items: [
    { name: "Kubernetes", icon: { brand: "kubernetes" } },
    { name: "Docker", icon: { brand: "docker" } },
    { name: "Helm", icon: { brand: "helm" } },
    { name: "Dapr", icon: { brand: "dapr" } },
  ] },
  { id: "iac", title: "Infrastructure as Code", items: [
    { name: "Terraform", icon: { brand: "terraform" } },
    { name: "Azure Verified Modules", icon: { line: "modules" } },
    { name: "ARM templates", icon: { line: "braces" } },
  ] },
  { id: "cicd", title: "CI/CD", items: [
    { name: "Azure DevOps", icon: { brand: "azuredevops" } },
    { name: "GitLab CI", icon: { brand: "gitlab" } },
    { name: "Jenkins", icon: { brand: "jenkins" } },
    { name: "Git", icon: { brand: "git" } },
  ] },
  { id: "networking", title: "Networking", items: [
    { name: "VNets", icon: { line: "network" } },
    { name: "VNet peering", icon: { line: "link" } },
    { name: "Private Endpoints", icon: { line: "lock" } },
    { name: "Private and public DNS", icon: { line: "globe" } },
    { name: "NSGs", icon: { line: "firewall" } },
    { name: "Azure CNI Overlay", icon: { line: "layers" } },
    { name: "Cilium", icon: { brand: "cilium" } },
  ] },
  { id: "security", title: "Security", items: [
    { name: "SonarCloud", icon: { brand: "sonarqubecloud" } },
    { name: "Trivy", icon: { brand: "trivy" } },
    { name: "JFrog Xray", icon: { brand: "jfrog" } },
    { name: "Orca Security", icon: { line: "shield" } },
    { name: "ArmorCode", icon: { line: "shield" } },
    { name: "Distroless images", icon: { line: "box" } },
    { name: "RBAC", icon: { line: "userCheck" } },
    { name: "Managed Identity", icon: { line: "id" } },
  ] },
  { id: "observability", title: "Observability", items: [
    { name: "Azure Monitor", icon: { line: "chart" } },
    { name: "Application Insights", icon: { line: "activity" } },
    { name: "Log Analytics", icon: { line: "logs" } },
    { name: "Prometheus", icon: { brand: "prometheus" } },
    { name: "Grafana", icon: { brand: "grafana" } },
    { name: "Datadog", icon: { brand: "datadog" } },
    { name: "ELK", icon: { brand: "elasticstack" } },
  ] },
  { id: "languages", title: "Languages", items: [
    { name: "Python", icon: { brand: "python" } },
    { name: "Bash", icon: { brand: "gnubash" } },
    { name: "Azure CLI", icon: { line: "terminal" } },
    { name: "YAML", icon: { brand: "yaml" } },
  ] },
];

/** Work stack terms that are deliberately not tools in the stack grid. */
export const NON_STACK_TERMS = ["Remote state", "OpenAPI", "Azure Cost Management API"];

export const TIMELINE: TimelineStop[] = [
  { id: "education", kind: "education", period: "2014 – 2018", heading: "B.E., Electronics & Communication", org: "Don Bosco Institute of Technology, Bengaluru", bullets: [] },
  { id: "cubespace", kind: "work", period: "Feb 2018 – Sep 2019", heading: "DevOps Engineer", org: "Cubespace Technologies", bullets: [
    "Managed Azure virtual machines, networking and storage for client and internal projects.",
    "Introduced CI/CD automation and containerised legacy applications.",
  ] },
  { id: "unified-softech", kind: "work", period: "Jan 2020 – Oct 2022", heading: "DevOps Engineer", org: "Unified Softech", bullets: [
    "Built and ran Kubernetes platforms on Azure for production client workloads.",
    "Moved legacy deployments onto containers and Terraform-managed infrastructure.",
    "Delivered CI/CD pipelines and monitoring with Prometheus, Grafana and ELK.",
  ] },
  { id: "cnh", kind: "work", period: "Feb 2023 – Present", heading: "DevOps & Platform Engineering", org: "CNH Industrial",
    roles: [
      { title: "Software Engineer II, DevOps & Platform Engineering", period: "May 2025 – Present" },
      { title: "Software Engineer I, DevOps Engineering", period: "Feb 2023 – Apr 2025" },
    ],
    bullets: [
      // Spec 5.3: the public résumé's capability wording; no internal projects, migrations, incidents or metrics.
      "Build and operate production AKS clusters: provisioning, upgrades, node pools, autoscaling, isolation and hardening.",
      "Develop reusable Terraform modules for Azure using Azure Verified Modules (AVM), with a multi-state layout that separates networking, clusters and shared services.",
      "Design CI/CD pipelines in Azure DevOps and GitLab CI with reusable templates and enforced security gates for code, dependency and container image scanning.",
      "Manage Azure API Management (APIM): policies, backends, API lifecycle and automated OpenAPI publishing through pipelines.",
      "Implement private networking with VNets, peering, private endpoints and private DNS for platform services.",
      "Run observability with Azure Monitor, Prometheus, Grafana and Datadog.",
    ] },
];

export const ALL_WORK: WorkItem[] = [
  { id: "terraform", index: "01", kicker: "Reference pattern", diagram: "terraform",
    title: "Modular, multi-state Terraform for Azure",
    summary: "Turning one large Terraform configuration into isolated, reusable modules.",
    problem: "One configuration and one state for every environment means every change carries production risk, and engineers block each other.",
    approach: "Environment-isolated state, with private modules for networking, AKS and shared services built on Azure Verified Modules. Environments differ by variables, not copied code. Private endpoints and managed identity are module defaults, so the secure option is the easy one.",
    result: "Smaller blast radius, independently reviewable changes, and safe parallel work.",
    constraints: { status: "DRAFT", items: [
      "A change to one environment must not be able to affect another.",
      "Other teams must be able to reuse the modules without copying code.",
      "Private endpoints and managed identity must be the default, not an opt-in.",
      "Each change must stay small enough to review on its own.",
    ] },
    stack: ["Terraform", "Azure Verified Modules", "Remote state", "Azure"] },
  { id: "pipelines", index: "02", kicker: "Reference pattern", diagram: "pipeline",
    title: "Secure-by-default delivery pipelines",
    summary: "Security scanning that actually stops bad builds.",
    problem: "Scanners that only produce reports get ignored, and vulnerabilities reach production anyway.",
    approach: "Shared pipeline templates with SAST, dependency and container image scanning as blocking gates. Distroless base images. Secrets pulled from Key Vault at runtime, never stored in pipeline code.",
    result: "Issues caught before release, consistent controls across every service, and no credentials in repositories.",
    constraints: { status: "DRAFT", items: [
      "A failed security scan must stop the release, not just produce a report.",
      "Every service must get the same controls from shared templates.",
      "No credentials may be stored in pipeline code or repositories.",
      "Base images must carry as little as possible to scan and patch.",
    ] },
    stack: ["Azure DevOps", "GitLab CI", "SonarCloud", "Trivy", "JFrog Xray", "Key Vault"] },
  { id: "cni", index: "03", kicker: "Reference pattern", diagram: "cni",
    title: "Scaling AKS networking with CNI Overlay and Cilium",
    summary: "When classic Azure CNI runs out of addresses, and how to move off it.",
    problem: "Classic Azure CNI gives every pod an address from the VNet, so growing clusters exhaust their subnets.",
    approach: "CNI Overlay keeps pod addresses off the VNet, and Cilium adds eBPF networking and network policy. The migration is planned around stateful workloads so no data is lost.",
    result: "Headroom to scale, faster networking and enforceable network policy.",
    constraints: { status: "DRAFT", items: [
      "Pod growth must not consume VNet address space.",
      "Stateful workloads must move without losing data.",
      "Network policy must be enforceable, not advisory.",
    ] },
    stack: ["AKS", "Azure CNI Overlay", "Cilium", "Terraform"] },
  { id: "apim", index: "04", kicker: "Reference pattern", diagram: "apim",
    title: "API publishing with Azure API Management",
    summary: "APIs that deploy with the service instead of by hand.",
    problem: "APIs updated manually in the portal drift away from the code behind them.",
    approach: "OpenAPI specs versioned alongside each service. Pipelines import the API, apply policies and publish per environment, and gateway logs flow into monitoring.",
    result: "Consistent policies, auditable changes, and APIs that always match the deployed code.",
    constraints: { status: "DRAFT", items: [
      "The API published at the gateway must always match the deployed code.",
      "Policies must be applied the same way in every environment.",
      "No API changes may be made by hand in the portal.",
      "Gateway traffic must be visible in monitoring.",
    ] },
    stack: ["Azure API Management", "OpenAPI", "Azure DevOps", "Datadog"] },
  { id: "aura", index: "05", kicker: "Personal project · In progress", diagram: "aura",
    title: "AURA: cloud cost intelligence",
    summary: "Plain-language cloud cost reporting powered by an LLM.",
    whatItDoes: "A Python service on Kubernetes pulls Azure Cost Management data, uses an LLM to explain what changed and why, and sends HTML reports with KPI cards and trend charts. Being redesigned around a project-centric model.",
    stack: ["Python", "AKS", "Azure Cost Management API", "Azure OpenAI"] },
];

export const WORK: WorkItem[] = ALL_WORK.filter((w) => w.id !== "aura" || AURA_CLEANROOM_CONFIRMED);

/** Verified from the issuers by Manoj (2026-10-08). Expiry is kept for reference, not shown. */
export const CERTIFICATIONS: Certification[] = [
  { badge: "AZ-104", name: "Microsoft Certified: Azure Administrator Associate", code: "AZ-104", issuer: "Microsoft",
    earned: "2026-07-12", expires: "2027-07-12",
    verifyUrl: "https://learn.microsoft.com/api/credentials/share/en-us/MANOJKUMARM-0248/86275562C52DBC07?sharingId=346965264DE87BDA",
    image: { src: "/badges/az-104.svg", alt: "Microsoft Certified: Associate badge" } },
  { badge: "Terraform Associate", name: "HashiCorp Certified: Terraform Associate", code: "003", issuer: "HashiCorp (IBM)",
    earned: "2025-06-29", expires: "2027-06-29",
    verifyUrl: "https://www.credly.com/badges/5bb7c69e-706c-42e1-a0b4-23b5f54f7950/public_url",
    image: { src: "/badges/terraform-associate-003.webp", alt: "HashiCorp Certified: Terraform Associate (003) badge" } },
  { badge: "AZ-900", name: "Microsoft Certified: Azure Fundamentals", code: "AZ-900", issuer: "Microsoft",
    earned: "2023-11-12",
    verifyUrl: "https://learn.microsoft.com/api/credentials/share/en-us/MANOJKUMARM-0248/63F13D872332851A?sharingId=346965264DE87BDA",
    image: { src: "/badges/az-900.svg", alt: "Microsoft Certified: Fundamentals badge" } },
];

export const IN_PROGRESS = "Certified Kubernetes Administrator (CKA)";

export const STATS: Stat[] = [
  { prefix: "Since", value: "2018", caption: "Building on Azure" },
  { value: String(CERTIFICATIONS.length), caption: "Certifications" },
];

export const CONTACT: ContactContent = {
  heading: "Let's talk",
  body: "Hiring for a platform, DevOps or SRE role, or want to talk Azure, Kubernetes or Terraform? Send me a note. I usually reply within two working days.",
};

export const SEO: SeoContent = {
  title: "Manoj Kumar | DevOps & Platform Engineer (Azure, Kubernetes, Terraform)",
  description: "DevOps and platform engineer building on Microsoft Azure since 2018: AKS, Terraform, CI/CD, API Management and DevSecOps. Based in Bengaluru, India.",
  ogTitle: "Manoj Kumar | DevOps & Platform Engineer",
  ogDescription: brand.positioning,
  knowsAbout: ["Microsoft Azure", "Kubernetes", "Terraform", "Azure DevOps", "Azure API Management", "DevSecOps", "Site Reliability Engineering"],
};
