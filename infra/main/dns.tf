resource "azurerm_dns_zone" "site" {
  name                = var.domain
  resource_group_name = azurerm_resource_group.portfolio.name
  tags                = var.tags
}

# Apex: alias A record straight to the Static Web App (GoDaddy DNS can't do this; Azure DNS can).
resource "azurerm_dns_a_record" "apex" {
  name                = "@"
  zone_name           = azurerm_dns_zone.site.name
  resource_group_name = azurerm_resource_group.portfolio.name
  ttl                 = 3600
  target_resource_id  = azurerm_static_web_app.site.id
  tags                = var.tags
}

resource "azurerm_dns_cname_record" "www" {
  name                = "www"
  zone_name           = azurerm_dns_zone.site.name
  resource_group_name = azurerm_resource_group.portfolio.name
  ttl                 = 3600
  record              = azurerm_static_web_app.site.default_host_name
  tags                = var.tags
}

locals {
  apex_validation_token = var.enable_custom_domains ? terraform_data.apex_validation_token[0].output : null
  # Azure DNS allows one TXT record set per name, so SPF and the validation token share "@".
  apex_txt_values = compact(["v=spf1 -all", local.apex_validation_token])
}

resource "azurerm_dns_txt_record" "apex" {
  name                = "@"
  zone_name           = azurerm_dns_zone.site.name
  resource_group_name = azurerm_resource_group.portfolio.name
  ttl                 = 3600
  tags                = var.tags

  dynamic "record" {
    for_each = local.apex_txt_values
    content {
      value = record.value
    }
  }
}

# Anti-spoofing: this domain never sends or receives email.
resource "azurerm_dns_txt_record" "dmarc" {
  name                = "_dmarc"
  zone_name           = azurerm_dns_zone.site.name
  resource_group_name = azurerm_resource_group.portfolio.name
  ttl                 = 3600
  tags                = var.tags

  record {
    value = "v=DMARC1; p=reject;"
  }
}

resource "azurerm_dns_mx_record" "null_mx" {
  count               = var.enable_null_mx ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.site.name
  resource_group_name = azurerm_resource_group.portfolio.name
  ttl                 = 3600
  tags                = var.tags

  record {
    preference = "0"
    exchange   = "."
  }
}
