mock_provider "azurerm" {
  mock_resource "azurerm_resource_group" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-mkthecoder-portfolio"
    }
  }
  mock_resource "azurerm_static_web_app" {
    defaults = {
      id                = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-mkthecoder-portfolio/providers/Microsoft.Web/staticSites/stapp-mkthecoder-portfolio"
      default_host_name = "calm-tree-0a1b2c3d4.6.azurestaticapps.net"
      api_key           = "mock-deployment-token"
    }
  }
  mock_resource "azurerm_dns_zone" {
    defaults = {
      name_servers = ["ns1-01.azure-dns.com.", "ns2-01.azure-dns.net.", "ns3-01.azure-dns.org.", "ns4-01.azure-dns.info."]
    }
  }
  mock_resource "azurerm_static_web_app_custom_domain" {
    defaults = {
      validation_token = "mock-validation-token"
    }
  }
}

variables {
  subscription_id = "00000000-0000-0000-0000-000000000000"
  alert_emails    = ["alerts@example.com", "owner@example.com"]
}

run "first_apply_has_no_custom_domains_and_only_spf_in_txt" {
  assert {
    condition     = length(azurerm_static_web_app_custom_domain.apex) == 0 && length(azurerm_static_web_app_custom_domain.www) == 0
    error_message = "Custom domains must wait for the second apply."
  }
  assert {
    condition     = toset([for r in azurerm_dns_txt_record.apex.record : r.value]) == toset(["v=spf1 -all"])
    error_message = "Before custom domains, the apex TXT holds only SPF."
  }
  assert {
    condition     = output.apex_validation_token == null
    error_message = "No validation token yet."
  }
}

run "site_and_dns_basics" {
  assert {
    condition     = azurerm_static_web_app.site.sku_tier == "Free" && azurerm_static_web_app.site.sku_size == "Free"
    error_message = "Static Web App must be Free."
  }
  assert {
    condition     = azurerm_static_web_app.site.location == "eastasia" && azurerm_resource_group.portfolio.location == "centralindia"
    error_message = "Regions are fixed by the spec."
  }
  assert {
    condition     = azurerm_dns_zone.site.name == "mkthecoder.com"
    error_message = "Zone is mkthecoder.com."
  }
  assert {
    condition     = azurerm_dns_a_record.apex.name == "@" && azurerm_dns_a_record.apex.target_resource_id == azurerm_static_web_app.site.id
    error_message = "Apex is an alias A record to the Static Web App."
  }
  assert {
    condition     = azurerm_dns_cname_record.www.record == "calm-tree-0a1b2c3d4.6.azurestaticapps.net"
    error_message = "www points at the default hostname."
  }
  assert {
    condition     = length(output.name_servers) == 4
    error_message = "Four name servers for GoDaddy."
  }
  assert {
    condition     = azurerm_resource_group.portfolio.tags["project"] == "portfolio" && azurerm_static_web_app.site.tags["managed-by"] == "terraform"
    error_message = "Standard tags missing."
  }
}

run "anti_spoofing_records" {
  assert {
    condition     = azurerm_dns_txt_record.dmarc.name == "_dmarc" && one([for r in azurerm_dns_txt_record.dmarc.record : r.value]) == "v=DMARC1; p=reject;"
    error_message = "DMARC must reject."
  }
  assert {
    condition     = one([for r in azurerm_dns_mx_record.null_mx[0].record : r.exchange]) == "." && one([for r in azurerm_dns_mx_record.null_mx[0].record : r.preference]) == "0"
    error_message = "Null MX is 0 . (RFC 7505)."
  }
}

run "resource_group_budget" {
  assert {
    condition     = azurerm_consumption_budget_resource_group.portfolio.amount == 100
    error_message = "Portfolio budget is 100 a month."
  }
  assert {
    condition     = toset([for n in azurerm_consumption_budget_resource_group.portfolio.notification : "${n.threshold_type}:${n.threshold}"]) == toset(["Actual:50", "Actual:80", "Actual:100", "Forecasted:100"])
    error_message = "Alerts at 50%, 80% and 100% of actual spend, and when the forecast reaches 100%."
  }
  assert {
    condition     = alltrue([for n in azurerm_consumption_budget_resource_group.portfolio.notification : toset(n.contact_emails) == toset(["alerts@example.com", "owner@example.com"])])
    error_message = "Every alert goes to every address in alert_emails."
  }
}

run "second_apply_adds_custom_domains_and_keeps_spf" {
  variables {
    enable_custom_domains = true
  }
  assert {
    condition     = azurerm_static_web_app_custom_domain.apex[0].domain_name == "mkthecoder.com" && azurerm_static_web_app_custom_domain.apex[0].validation_type == "dns-txt-token"
    error_message = "Apex uses TXT validation."
  }
  assert {
    condition     = azurerm_static_web_app_custom_domain.www[0].domain_name == "www.mkthecoder.com" && azurerm_static_web_app_custom_domain.www[0].validation_type == "cname-delegation"
    error_message = "www uses CNAME delegation."
  }
  assert {
    condition     = toset([for r in azurerm_dns_txt_record.apex.record : r.value]) == toset(["v=spf1 -all", "mock-validation-token"])
    error_message = "Apex TXT must hold SPF and the validation token together."
  }
  assert {
    condition     = output.apex_validation_token == "mock-validation-token"
    error_message = "Token is exposed for troubleshooting."
  }
}

run "null_mx_can_be_turned_off" {
  variables {
    enable_null_mx = false
  }
  assert {
    condition     = length(azurerm_dns_mx_record.null_mx) == 0
    error_message = "enable_null_mx = false removes only the MX record."
  }
  assert {
    condition     = one([for r in azurerm_dns_txt_record.dmarc.record : r.value]) == "v=DMARC1; p=reject;"
    error_message = "DMARC stays."
  }
}

run "rejects_a_non_guid_subscription_id" {
  command = plan
  variables {
    subscription_id = "mk-personal"
  }
  expect_failures = [var.subscription_id]
}
