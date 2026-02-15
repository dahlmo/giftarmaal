terraform {
  required_providers {
    upcloud = {
      source  = "UpCloudLtd/upcloud"
      version = "~> 5.33"
    }
  }
}

provider "upcloud" {}

variable "zone" { default = "no-svg1" }
variable "ssh_pubkey" { type = string }
variable "repo_url" { type = string } # https://github.com/you/repo.git
variable "domain" { type = string }   # demo.example.org

resource "upcloud_server" "app" {
  zone     = var.zone
  title    = "wedding-d"
  hostname = "wedding-d"
  plan     = "1xCPU-2GB" # juster

  firewall = true

  template {
    storage = "Ubuntu Server 24.04 LTS (Noble Numbat)"
    size    = 30
  }

  network_interface {
    type = "public"
  }

  login {
    user = "ubuntu"
    keys = [var.ssh_pubkey]
  }

  metadata = true

  user_data = templatefile("${path.module}/cloud-init.yml.tftpl", {
    repo_url = var.repo_url
    domain   = var.domain
  })
}

output "public_ip" {
  value = upcloud_server.app.network_interface[0].ip_address
}
