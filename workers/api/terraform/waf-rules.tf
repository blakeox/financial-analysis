# Cloudflare WAF Custom Rules for Chat Security
# 
# This Terraform configuration creates WAF rules for:
# - Prompt injection detection
# - XSS/SQLi pattern blocking
# - Suspicious content encoding
#
# Usage:
# 1. Set environment variables:
#    export CLOUDFLARE_API_TOKEN=your_api_token
#    export CLOUDFLARE_ZONE_ID=your_zone_id
# 2. Run: terraform init && terraform plan
# 3. Deploy in challenge mode first: terraform apply
# 4. Monitor for 24-48 hours, then switch action to "block"

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for financial-analysis domain"
  type        = string
}

variable "rule_action" {
  description = "Action to take on rule match: challenge, block, or log"
  type        = string
  default     = "challenge" # Start with challenge mode
}

# Rule 1: Prompt Injection Detection
resource "cloudflare_ruleset" "chat_security_waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "Chat Security WAF Rules"
  description = "Custom WAF rules for chat endpoint security"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action      = var.rule_action
    description = "Block prompt injection attempts - system prompt leakage"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "ignore previous instructions" or
        http.request.body.raw contains "show system prompt" or
        http.request.body.raw contains "reveal your instructions" or
        http.request.body.raw contains "forget all previous" or
        http.request.body.raw contains "disregard all prior" or
        http.request.body.raw contains "override your programming"
      )
    EOT
  }

  rules {
    action      = var.rule_action
    description = "Block prompt injection - role manipulation"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "you are now a" or
        http.request.body.raw contains "act as a" or
        http.request.body.raw contains "pretend you are" or
        http.request.body.raw contains "roleplay as" or
        http.request.body.raw contains "simulate being"
      )
    EOT
  }

  rules {
    action      = var.rule_action
    description = "Block prompt injection - output format manipulation"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "respond only with" or
        http.request.body.raw contains "output format:" or
        http.request.body.raw contains "return raw data" or
        http.request.body.raw contains "disable formatting" or
        http.request.body.raw contains "bypass validation"
      )
    EOT
  }

  rules {
    action      = var.rule_action
    description = "Block DAN/jailbreak prompts"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "DAN mode" or
        http.request.body.raw contains "Do Anything Now" or
        http.request.body.raw contains "jailbreak" or
        http.request.body.raw contains "unrestricted mode" or
        http.request.body.raw contains "developer mode override"
      )
    EOT
  }

  rules {
    action      = var.rule_action
    description = "Block suspicious encoding (base64, unicode obfuscation)"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "base64," or
        http.request.body.raw matches "(?i)\\\\u[0-9a-f]{4}" or
        http.request.body.raw contains "atob(" or
        http.request.body.raw contains "btoa(" or
        http.request.body.raw contains "\\x"
      )
    EOT
  }

  rules {
    action      = "block"
    description = "Block known XSS patterns in chat messages"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "<script" or
        http.request.body.raw contains "javascript:" or
        http.request.body.raw contains "onerror=" or
        http.request.body.raw contains "onload=" or
        http.request.body.raw contains "onclick="
      )
    EOT
  }

  rules {
    action      = "block"
    description = "Block SQL injection patterns"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        http.request.body.raw contains "' OR '1'='1" or
        http.request.body.raw contains "'; DROP TABLE" or
        http.request.body.raw contains "UNION SELECT" or
        http.request.body.raw contains "exec(" or
        http.request.body.raw contains "execute("
      )
    EOT
  }

  rules {
    action      = var.rule_action
    description = "Challenge requests with suspicious User-Agent"
    enabled     = true
    expression  = <<-EOT
      (http.request.uri.path eq "/v1/api/chat/enhanced" or http.request.uri.path eq "/api/v1/chat/enhanced") and
      (
        lower(http.user_agent) contains "bot" or
        lower(http.user_agent) contains "crawler" or
        lower(http.user_agent) contains "spider" or
        lower(http.user_agent) contains "scraper" or
        http.user_agent eq ""
      )
    EOT
  }
}

# Output rule IDs for reference
output "waf_ruleset_id" {
  description = "ID of the created WAF ruleset"
  value       = cloudflare_ruleset.chat_security_waf.id
}
