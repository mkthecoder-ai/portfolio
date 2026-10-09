# Infrastructure

Terraform for mkthecoder.com, in Manoj's personal Azure subscription (`mk-personal`).

| Folder | What | State |
|---|---|---|
| `bootstrap/` | Shared: Azure AD-only state storage and the subscription budget | local, run once |
| `main/` | Portfolio: Static Web App (Free), budget, custom domains. DNS stays at GoDaddy | `portfolio/main.tfstate` in the bootstrap storage |

- Cost guard: both budgets are 100 INR a month, alerting at 50%, 80% and 100% of actual spend and at 100% of forecast. Budgets only alert (pay-as-you-go has no hard cap), so keep every SKU at Free/Standard LRS; there is no fixed cost (no Azure DNS zone; DNS stays at GoDaddy).
- Tests run offline with mocked providers: `terraform init -backend=false && terraform test` in each folder.
- Private values (`subscription_id`, `alert_emails`) go in `terraform.tfvars`, which is gitignored. Copy them from `terraform.tfvars.example`.
- Applying is manual and done by the owner: `bootstrap/` once (local state), then `main/`
  (`terraform init -backend-config="storage_account_name=$(terraform -chdir=../bootstrap output -raw storage_account_name)"`).
- Deploys: `.github/workflows/deploy.yml` uploads `site/out` once the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret (an output of `main/`) is set; until then it skips with a notice.

## Custom domain with GoDaddy DNS

DNS stays at GoDaddy (no Azure DNS zone). GoDaddy can't alias the apex to a hostname, so the apex uses an
`A` record to the app's stable inbound IP (served from its region), and `www` a `CNAME` (served globally).

1. In GoDaddy DNS, delete the default parking `A @` record and the `CNAME www -> @`; turn off domain forwarding.
2. Add `CNAME www -> <default_host_name>` (`terraform output godaddy_records`).
3. Add `A @ -> <stableInboundIP>`:
   `az rest --method get --url "https://management.azure.com/subscriptions/<sub>/resourceGroups/rg-mkthecoder-portfolio/providers/Microsoft.Web/staticSites/stapp-mkthecoder-portfolio?api-version=2023-12-01" --query properties.stableInboundIP -o tsv`
4. Anti-spoofing (the domain sends no mail): `TXT @ "v=spf1 -all"` and `TXT _dmarc "v=DMARC1; p=reject;"`.
5. Once `www` resolves, apply `main/` with `enable_custom_domains = true`, then add the new `TXT @` token from
   `terraform output godaddy_records` (a separate TXT record beside SPF). Azure validates it and issues the
   certificates; this can take up to a few hours.
