output "name_servers" {
  description = "Enter these four in GoDaddy: Nameservers > I'll use my own nameservers."
  value       = azurerm_dns_zone.site.name_servers
}

output "default_host_name" {
  description = "The site's *.azurestaticapps.net address (works before the custom domain)."
  value       = azurerm_static_web_app.site.default_host_name
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
