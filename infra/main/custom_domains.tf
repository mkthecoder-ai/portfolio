# Created only in the second apply. DNS stays at GoDaddy (decision 2026-10-09: no Azure DNS zone, saves its
# monthly charge); the records to add there are in output.godaddy_records.

resource "azurerm_static_web_app_custom_domain" "apex" {
  count             = var.enable_custom_domains ? 1 : 0
  static_web_app_id = azurerm_static_web_app.site.id
  domain_name       = var.domain
  validation_type   = "dns-txt-token"
}

# The token is only reliable when the domain is first created. Keep it, so later refreshes
# can't remove it from the apex TXT record.
resource "terraform_data" "apex_validation_token" {
  count = var.enable_custom_domains ? 1 : 0
  input = azurerm_static_web_app_custom_domain.apex[0].validation_token

  lifecycle {
    ignore_changes = [input]
  }
}

resource "azurerm_static_web_app_custom_domain" "www" {
  count             = var.enable_custom_domains ? 1 : 0
  static_web_app_id = azurerm_static_web_app.site.id
  domain_name       = "www.${var.domain}"
  validation_type   = "cname-delegation"
}

locals {
  apex_validation_token = var.enable_custom_domains ? terraform_data.apex_validation_token[0].output : null
}
