# Created only in the second apply, after the GoDaddy nameservers point at Azure DNS.

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
  depends_on        = [azurerm_dns_cname_record.www]
}
