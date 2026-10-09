mock_provider "azurerm" {
  mock_data "azurerm_client_config" {
    defaults = {
      object_id       = "11111111-1111-1111-1111-111111111111"
      tenant_id       = "22222222-2222-2222-2222-222222222222"
      subscription_id = "00000000-0000-0000-0000-000000000000"
    }
  }
  mock_data "azurerm_subscription" {
    defaults = {
      id              = "/subscriptions/00000000-0000-0000-0000-000000000000"
      subscription_id = "00000000-0000-0000-0000-000000000000"
    }
  }
}

variables {
  subscription_id = "00000000-0000-0000-0000-000000000000"
  alert_email     = "alerts@example.com"
}

run "state_storage_is_azure_ad_only_and_private" {
  command = plan

  assert {
    condition     = azurerm_storage_account.tfstate.shared_access_key_enabled == false
    error_message = "Shared keys must stay disabled."
  }
  assert {
    condition     = azurerm_storage_account.tfstate.allow_nested_items_to_be_public == false
    error_message = "Blobs must never be public."
  }
  assert {
    condition     = azurerm_storage_account.tfstate.min_tls_version == "TLS1_2"
    error_message = "TLS 1.2 minimum."
  }
  assert {
    condition     = azurerm_storage_account.tfstate.blob_properties[0].versioning_enabled == true
    error_message = "State blobs must be versioned."
  }
  assert {
    condition     = azurerm_storage_container.tfstate.container_access_type == "private"
    error_message = "The state container must be private."
  }
  assert {
    condition     = azurerm_role_assignment.state_blob_contributor.role_definition_name == "Storage Blob Data Contributor"
    error_message = "Manoj needs Storage Blob Data Contributor for Azure AD backend access."
  }
  assert {
    condition     = azurerm_role_assignment.state_blob_contributor.principal_id == "11111111-1111-1111-1111-111111111111"
    error_message = "The role goes to the signed-in user."
  }
}

run "subscription_budget_alerts_at_80_and_100" {
  command = plan

  assert {
    condition     = azurerm_consumption_budget_subscription.monthly.amount == 1000
    error_message = "Subscription budget is 1000 a month."
  }
  assert {
    condition     = toset([for n in azurerm_consumption_budget_subscription.monthly.notification : n.threshold]) == toset([80, 100])
    error_message = "Alerts at 80% and 100%."
  }
  assert {
    condition     = alltrue([for n in azurerm_consumption_budget_subscription.monthly.notification : contains(n.contact_emails, "alerts@example.com")])
    error_message = "Every alert goes to alert_email."
  }
}

run "tags_every_resource" {
  command = plan

  assert {
    condition     = azurerm_resource_group.tfstate.tags["managed-by"] == "terraform" && azurerm_storage_account.tfstate.tags["owner"] == "mkthecoder"
    error_message = "Standard tags missing."
  }
}

run "rejects_a_non_guid_subscription_id" {
  command = plan
  variables {
    subscription_id = "my-subscription"
  }
  expect_failures = [var.subscription_id]
}
