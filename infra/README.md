# Infrastructure

Terraform for mkthecoder.com, in Manoj's personal Azure subscription (`mk-personal`).

| Folder | What | State |
|---|---|---|
| `bootstrap/` | Shared: Azure AD-only state storage and the subscription budget | local, run once |
| `main/` | Portfolio: Static Web App, Azure DNS (with anti-spoofing records), budget, custom domains | `portfolio/main.tfstate` in the bootstrap storage |

- Cost guard: both budgets are 100 INR a month, alerting at 50%, 80% and 100% of actual spend and at 100% of forecast. Budgets only alert (pay-as-you-go has no hard cap), so keep every SKU at Free/Standard LRS; the DNS zone (about 0.50 USD a month) is the only fixed cost.
- Tests run offline with mocked providers: `terraform init -backend=false && terraform test` in each folder.
- Private values (`subscription_id`, `alert_emails`) go in `terraform.tfvars`, which is gitignored. Copy them from `terraform.tfvars.example`.
- Applying is manual and done by the owner: `bootstrap/` once, then `main/` with `enable_custom_domains = false`; once DNS has moved to Azure, apply again with `true` (two steps, so the TXT validation record exists before the domains are bound).
- Deploys: `.github/workflows/deploy.yml` uploads `site/out` once the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret (an output of `main/`) is set; until then it skips with a notice.
