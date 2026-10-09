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

variable "location" {
  description = "Region for the state resource group and storage account."
  type        = string
  default     = "centralindia"
}

variable "subscription_budget_amount" {
  description = "Monthly budget for the whole mk-personal subscription, in the billing currency (INR)."
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
    project      = "shared-tfstate"
    owner        = "mkthecoder"
    "managed-by" = "terraform"
  }
}
