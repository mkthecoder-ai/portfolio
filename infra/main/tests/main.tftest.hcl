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

run "first_apply_has_no_custom_domains_and_no_azure_dns" {
  assert {
    condition     = length(azurerm_static_web_app_custom_domain.apex) == 0 && length(azurerm_static_web_app_custom_domain.www) == 0
    error_message = "Custom domains must wait for the second apply."
  }
  assert {
    condition     = output.apex_validation_token == null
    error_message = "No validation token yet."
  }
  assert {
    condition     = output.godaddy_records == [{ type = "CNAME", name = "www", value = "calm-tree-0a1b2c3d4.6.azurestaticapps.net" }]
    error_message = "Before custom domains, GoDaddy only needs the www CNAME (DNS stays at GoDaddy; no Azure DNS zone)."
  }
}

run "site_basics" {
  assert {
    condition     = azurerm_static_web_app.site.sku_tier == "Free" && azurerm_static_web_app.site.sku_size == "Free"
    error_message = "Static Web App must be Free."
  }
  assert {
    condition     = azurerm_static_web_app.site.location == "eastasia" && azurerm_resource_group.portfolio.location == "centralindia"
    error_message = "Regions are fixed by the spec."
  }
  assert {
    condition     = azurerm_resource_group.portfolio.tags["project"] == "portfolio" && azurerm_static_web_app.site.tags["managed-by"] == "terraform"
    error_message = "Standard tags missing."
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

run "second_apply_binds_both_domains_and_lists_the_txt_token" {
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
    condition     = output.apex_validation_token == "mock-validation-token"
    error_message = "Token is exposed for the GoDaddy TXT record."
  }
  assert {
    condition     = contains(output.godaddy_records, { type = "TXT", name = "@", value = "mock-validation-token" })
    error_message = "GoDaddy records include the apex TXT validation token."
  }
}

run "rejects_a_non_guid_subscription_id" {
  command = plan
  variables {
    subscription_id = "mk-personal"
  }
  expect_failures = [var.subscription_id]
}
