# Cloudflare Security Infrastructure (Terraform)

This directory contains Terraform configurations for Cloudflare security features.

## Prerequisites

1. Install Terraform: https://www.terraform.io/downloads
2. Get your Cloudflare API token: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions: Zone.Firewall Services (Edit), Zone.Zone Settings (Read)
3. Find your Zone ID in Cloudflare dashboard

## Setup

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN=your_api_token_here
export CLOUDFLARE_ZONE_ID=your_zone_id_here

# Initialize Terraform
terraform init

# Preview changes
terraform plan -var="cloudflare_zone_id=$CLOUDFLARE_ZONE_ID"

# Apply changes (start in challenge mode)
terraform apply -var="cloudflare_zone_id=$CLOUDFLARE_ZONE_ID" -var="rule_action=challenge"
```

## Deployment Strategy

1. **Phase 1: Challenge Mode (24-48 hours)**
   ```bash
   terraform apply -var="rule_action=challenge"
   ```
   Monitor Cloudflare Firewall Events to verify rules are working correctly.

2. **Phase 2: Block Mode (production)**
   ```bash
   terraform apply -var="rule_action=block"
   ```
   Switch to blocking after validating false positive rate is acceptable.

## Files

- `waf-rules.tf` - WAF custom rules for prompt injection, XSS, SQLi detection
- `logpush-config.tf` - (TODO) Logpush configuration for R2
- `rate-limiting.tf` - (TODO) Rate limiting rules per endpoint

## Monitoring

After deployment, monitor:
- Cloudflare Dashboard → Security → Events
- Filter by "Firewall" to see blocked/challenged requests
- Review for false positives before switching to block mode

## Rollback

To remove all rules:
```bash
terraform destroy
```

To disable specific rules, edit the .tf file and set `enabled = false`, then run `terraform apply`.
