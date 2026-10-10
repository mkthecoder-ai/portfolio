terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.8"
    }
  }

  # storage_account_name is passed at init (it has a random suffix):
  #   terraform init -backend-config="storage_account_name=$(terraform -chdir=../bootstrap output -raw storage_account_name)"
  backend "azurerm" {
    resource_group_name = "rg-mkthecoder-tfstate"
    container_name      = "tfstate"
    key                 = "portfolio/main.tfstate"
    use_azuread_auth    = true
  }
}

provider "azurerm" {
  features {}
  subscription_id                = var.subscription_id
  storage_use_azuread            = true
  resource_providers_to_register = ["Microsoft.Web", "Microsoft.Consumption"]
}
