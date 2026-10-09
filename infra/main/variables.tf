variable "subscription_id" {
  description = "The mk-personal subscription ID. Set in terraform.tfvars, which is never committed."
  type        = string
  validation {
    condition     = can(regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.subscription_id))
    error_message = "subscription_id must be a subscription GUID."
  }
}

variable "alert_emails" {
  description = "Where budget alerts go (every alert goes to every address). Set in terraform.tfvars."
  type        = list(string)
  validation {
    condition     = length(var.alert_emails) > 0 && alltrue([for e in var.alert_emails : can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", e))])
    error_message = "alert_emails must be a non-empty list of email addresses."
  }
}

variable "budget_alerts" {
  description = "Budget notifications: percentage of the budget and whether it is actual or forecast spend."
  type        = list(object({ threshold = number, threshold_type = string }))
  default = [
    { threshold = 50, threshold_type = "Actual" },
    { threshold = 80, threshold_type = "Actual" },
    { threshold = 100, threshold_type = "Actual" },
    { threshold = 100, threshold_type = "Forecasted" },
  ]
}

variable "domain" {
  description = "Apex domain served by the site."
  type        = string
  default     = "mkthecoder.com"
}

variable "location" {
  description = "Region for the resource group."
  type        = string
  default     = "centralindia"
}

variable "swa_location" {
  description = "Static Web Apps region (must be one Static Web Apps supports; content is served globally)."
  type        = string
  default     = "eastasia"
}

variable "enable_custom_domains" {
  description = "Second apply only: set true after the GoDaddy nameservers point at Azure DNS and have propagated."
  type        = bool
  default     = false
}

variable "enable_null_mx" {
  description = "Publish a null MX (0 .). Set false only if Azure DNS rejects '.' as the exchange."
  type        = bool
  default     = true
}

variable "rg_budget_amount" {
  description = "Monthly budget for the portfolio resource group, in the billing currency (INR)."
  type        = number
  default     = 100
}

variable "budget_start_date" {
  description = "First day of a month, RFC 3339. Ignored after creation."
  type        = string
  default     = "2026-10-01T00:00:00Z"
}

variable "tags" {
  description = "Tags for every taggable resource."
  type        = map(string)
  default = {
    project      = "portfolio"
    owner        = "mkthecoder"
    "managed-by" = "terraform"
  }
}
