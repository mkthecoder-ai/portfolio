variable "subscription_id" {
  description = "The mk-personal subscription ID. Set in terraform.tfvars, which is never committed."
  type        = string
  validation {
    condition     = can(regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.subscription_id))
    error_message = "subscription_id must be a subscription GUID."
  }
}

variable "alert_email" {
  description = "Where budget alerts go. Set in terraform.tfvars."
  type        = string
  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.alert_email))
    error_message = "alert_email must be an email address."
  }
}

variable "location" {
  description = "Region for the state resource group and storage account."
  type        = string
  default     = "centralindia"
}

variable "subscription_budget_amount" {
  description = "Monthly budget for the whole mk-personal subscription, in the billing currency."
  type        = number
  default     = 1000
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
