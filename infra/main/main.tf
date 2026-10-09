resource "azurerm_resource_group" "portfolio" {
  name     = "rg-mkthecoder-portfolio"
  location = var.location
  tags     = var.tags
}

resource "azurerm_static_web_app" "site" {
  name                         = "stapp-mkthecoder-portfolio"
  resource_group_name          = azurerm_resource_group.portfolio.name
  location                     = var.swa_location
  sku_tier                     = "Free"
  sku_size                     = "Free"
  preview_environments_enabled = true
  tags                         = var.tags
}

resource "azurerm_consumption_budget_resource_group" "portfolio" {
  name              = "budget-portfolio-monthly"
  resource_group_id = azurerm_resource_group.portfolio.id
  amount            = var.rg_budget_amount
  time_grain        = "Monthly"

  time_period {
    start_date = var.budget_start_date
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "GreaterThanOrEqualTo"
    contact_emails = [var.alert_email]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThanOrEqualTo"
    contact_emails = [var.alert_email]
  }

  lifecycle {
    ignore_changes = [time_period]
  }
}
