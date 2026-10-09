// Content rules from the spec (section 9.3), applied to the built HTML.

export function htmlToText(html) {
  return html
    .replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
}

export function findPhones(text) {
  return [...text.matchAll(/\+?\d[\d\s().-]{7,}\d/g)].map((m) => m[0]).filter((s) => s.replace(/\D/g, "").length >= 10);
}

const TEXT_RULES = [
  ["years-number", (t) => [...t.matchAll(/\b\d+\s*\+?\s*(?:years?|yrs?)\b/gi)].map((m) => m[0])],
  ["plus-years", (t) => [...t.matchAll(/\+\s*(?:years?|yrs?)\b/gi)].map((m) => m[0])],
  ["phone", findPhones],
  ["em-dash", (t) => (t.includes("—") ? ["—"] : [])],
  ["placeholder", (t) => [...t.matchAll(/\bTODO\b|\bTBD\b|\bDRAFT\b|\[(?:placeholder|add[^\]]*)\]/g)].map((m) => m[0])],
  ["availability", (t) => [...t.matchAll(/open to (?:work|remote|new conversations)/gi)].map((m) => m[0])],
];

const RAW_RULES = [
  ["old-linkedin", (h) => (h.includes("linkedin.com/in/manojkumarm0107") ? ["linkedin.com/in/manojkumarm0107"] : [])],
];

export function checkHtml(html) {
  const text = htmlToText(html);
  const problems = [];
  for (const [rule, find] of TEXT_RULES) for (const match of find(text)) problems.push({ rule, match });
  for (const [rule, find] of RAW_RULES) for (const match of find(html)) problems.push({ rule, match });
  return problems;
}

const LAUNCH_FILES = ["Manoj_Kumar_M_Resume.pdf"];

export function launchProblems(html, has) {
  const problems = [];
  for (const m of html.matchAll(/data-missing="([^"]+)"/g)) for (const reason of m[1].split(/\s+/)) problems.push(`missing: ${reason}`);
  for (const file of LAUNCH_FILES) if (!has(file)) problems.push(`missing file: ${file}`);
  return [...new Set(problems)];
}
