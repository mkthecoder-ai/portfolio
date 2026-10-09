output "default_host_name" {
  description = "The site's *.azurestaticapps.net address (works before the custom domain)."
  value       = azurerm_static_web_app.site.default_host_name
}

output "godaddy_records" {
  description = <<-EOT
    Records to add in GoDaddy DNS. Also add: A @ -> the app's stableInboundIP (az rest command in infra/README.md),
    and remove GoDaddy's default parking A record and www CNAME first.
  EOT
  value = concat(
    [{ type = "CNAME", name = "www", value = azurerm_static_web_app.site.default_host_name }],
    local.apex_validation_token == null ? [] : [{ type = "TXT", name = "@", value = local.apex_validation_token }],
  )
}

output "deployment_token" {
  description = "Static Web Apps deployment token. Pipe straight into: gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN"
  value       = azurerm_static_web_app.site.api_key
  sensitive   = true
}

output "apex_validation_token" {
  description = "TXT token for the apex domain (null until enable_custom_domains = true)."
  value       = local.apex_validation_token
}
