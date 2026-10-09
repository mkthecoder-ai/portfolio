#!/usr/bin/env node
// Applies the repository policy (README.md, "Repository policy"). Idempotent: run it again after any
// change to .github/rulesets/*.json. Needs `gh` logged in as the owner.
//
// - Repo settings: squash merges only (PR title + body), branches deleted after merge, "update branch" button.
// - Dependabot alerts and security updates; Actions get a read-only token and can't approve PRs.
// - Rulesets on main (.github/rulesets/): "core" (no bypass: PR required, CI green and up to date, linear history,
//   no force push, no deletion) and "owner review" (code-owner approval; the owner may bypass it on a PR).
// Rulesets need a public repository or GitHub Pro: on a private free repository they are reported and skipped.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const REPO = process.argv[2] ?? "mkthecoder-ai/portfolio";
const gh = (args, input) => execFileSync("gh", ["api", ...args], { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

gh(["-X", "PATCH", `repos/${REPO}`, "-F", "allow_squash_merge=true", "-F", "allow_merge_commit=false", "-F", "allow_rebase_merge=false",
  "-F", "delete_branch_on_merge=true", "-F", "allow_update_branch=true", "-f", "squash_merge_commit_title=PR_TITLE", "-f", "squash_merge_commit_message=PR_BODY"]);
gh(["-X", "PUT", `repos/${REPO}/vulnerability-alerts`]);
gh(["-X", "PUT", `repos/${REPO}/automated-security-fixes`]);
gh(["-X", "PUT", `repos/${REPO}/actions/permissions/workflow`, "-f", "default_workflow_permissions=read", "-F", "can_approve_pull_request_reviews=false"]);
console.log("repo settings: squash only, delete merged branches, Dependabot on, read-only Actions token");

const isPublic = JSON.parse(gh([`repos/${REPO}`])).visibility === "public";
if (isPublic) {
  // Free for public repositories: secret scanning with push protection, and private vulnerability reports.
  gh(["-X", "PATCH", `repos/${REPO}`, "--input", "-"], JSON.stringify({ security_and_analysis: {
    secret_scanning: { status: "enabled" }, secret_scanning_push_protection: { status: "enabled" } } }));
  gh(["-X", "PUT", `repos/${REPO}/private-vulnerability-reporting`]);
  console.log("public: secret scanning + push protection and private vulnerability reporting on");
}

let existing;
try {
  existing = JSON.parse(gh([`repos/${REPO}/rulesets`]));
} catch (e) {
  if (/Upgrade to GitHub Pro or make this repository public/.test(String(e.stderr))) {
    console.log("rulesets: skipped, GitHub needs this repository to be public (or GitHub Pro). Run this again then.");
    process.exit(0);
  }
  throw e;
}
const dir = new URL("../.github/rulesets/", import.meta.url);
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const body = readFileSync(new URL(file, dir), "utf8");
  const { name } = JSON.parse(body);
  const found = existing.find((r) => r.name === name);
  gh(found ? ["-X", "PUT", `repos/${REPO}/rulesets/${found.id}`, "--input", "-"] : ["-X", "POST", `repos/${REPO}/rulesets`, "--input", "-"], body);
  console.log(`ruleset ${found ? "updated" : "created"}: ${name}`);
}
