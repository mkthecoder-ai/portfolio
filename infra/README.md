# Infrastructure

Terraform for mkthecoder.com, in Manoj's personal Azure subscription (`mk-personal`).

| Folder | What | State |
|---|---|---|
| `bootstrap/` | Shared: Azure AD-only state storage and the subscription budget | local, run once |
| `main/` | Portfolio: Static Web App, Azure DNS (with anti-spoofing records), budget, custom domains | `portfolio/main.tfstate` in the bootstrap storage |

- Tests run offline with mocked providers: `terraform init -backend=false && terraform test` in each folder.
- Private values (`subscription_id`, `alert_email`) go in `terraform.tfvars`, which is gitignored. Copy them from `terraform.tfvars.example`.
- Applying is manual and done by the owner: `bootstrap/` once, then `main/` with `enable_custom_domains = false`; once DNS has moved to Azure, apply again with `true` (two steps, so the TXT validation record exists before the domains are bound).
- Deploys: `.github/workflows/deploy.yml` uploads `site/out` once the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret (an output of `main/`) is set; until then it skips with a notice.
