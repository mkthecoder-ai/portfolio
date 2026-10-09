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

  dynamic "notification" {
    for_each = var.budget_alerts
    content {
      enabled        = true
      threshold      = notification.value.threshold
      threshold_type = notification.value.threshold_type
      operator       = "GreaterThanOrEqualTo"
      contact_emails = var.alert_emails
    }
  }

  lifecycle {
    ignore_changes = [time_period]
  }
}
