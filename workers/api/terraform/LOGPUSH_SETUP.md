# Cloudflare Logpush to R2 Configuration

This guide explains how to configure Cloudflare Logpush to send HTTP request logs to R2 for security analysis.

## Prerequisites

1. R2 bucket created (e.g., `financial-analysis-logs`)
2. Cloudflare API token with Logs Read/Write permissions
3. Zone ID from Cloudflare dashboard

## Option 1: Dashboard Configuration (Recommended for initial setup)

1. Go to Cloudflare Dashboard → Analytics → Logs → Logpush
2. Click "Create Logpush job"
3. Select dataset: **HTTP requests**
4. Choose destination: **R2**
5. Configure:
   - R2 bucket: `financial-analysis-logs`
   - Path prefix: `http-logs/{DATE}`
   - Logpush frequency: Every 5 minutes
   - Fields: Select all security-relevant fields (see below)

### Recommended Fields

```json
{
  "ClientIP": true,
  "ClientRequestHost": true,
  "ClientRequestMethod": true,
  "ClientRequestPath": true,
  "ClientRequestQuery": true,
  "ClientRequestUserAgent": true,
  "EdgeResponseStatus": true,
  "EdgeStartTimestamp": true,
  "EdgeEndTimestamp": true,
  "FirewallMatchesActions": true,
  "FirewallMatchesRuleIDs": true,
  "RayID": true,
  "SecurityLevel": true,
  "WAFAction": true,
  "WAFFlags": true,
  "WAFMatchedVar": true,
  "WAFProfile": true,
  "WAFRuleID": true,
  "WAFRuleMessage": true,
  "ClientRequestBytes": true,
  "EdgeResponseBytes": true,
  "ClientCountry": true,
  "ClientASN": true
}
```

## Option 2: API Configuration (Infrastructure as Code)

Create Logpush job via API:

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN=your_api_token
export CLOUDFLARE_ZONE_ID=your_zone_id
export R2_ACCOUNT_ID=your_account_id
export R2_BUCKET_NAME=financial-analysis-logs

# Create Logpush job
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/logpush/jobs" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "financial-analysis-http-logs",
    "destination_conf": "r2://'${R2_BUCKET_NAME}'/http-logs/{DATE}?account-id='${R2_ACCOUNT_ID}'",
    "dataset": "http_requests",
    "enabled": true,
    "logpull_options": "fields=ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestPath,ClientRequestQuery,ClientRequestUserAgent,EdgeResponseStatus,EdgeStartTimestamp,EdgeEndTimestamp,FirewallMatchesActions,FirewallMatchesRuleIDs,RayID,SecurityLevel,WAFAction,WAFFlags,WAFMatchedVar,WAFProfile,WAFRuleID,WAFRuleMessage,ClientRequestBytes,EdgeResponseBytes,ClientCountry,ClientASN&timestamps=rfc3339",
    "frequency": "low"
  }'
```

## Option 3: Terraform Configuration

Add to your Terraform config:

```hcl
resource "cloudflare_logpush_job" "http_requests" {
  zone_id          = var.cloudflare_zone_id
  name             = "financial-analysis-http-logs"
  enabled          = true
  dataset          = "http_requests"
  frequency        = "low"
  destination_conf = "r2://${var.r2_bucket_name}/http-logs/{DATE}?account-id=${var.r2_account_id}"
  
  logpull_options = "fields=ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestPath,ClientRequestQuery,ClientRequestUserAgent,EdgeResponseStatus,EdgeStartTimestamp,EdgeEndTimestamp,FirewallMatchesActions,FirewallMatchesRuleIDs,RayID,SecurityLevel,WAFAction,WAFFlags,WAFMatchedVar,WAFProfile,WAFRuleID,WAFRuleMessage,ClientRequestBytes,EdgeResponseBytes,ClientCountry,ClientASN&timestamps=rfc3339"
}
```

## Verify Logpush

After creating the job, verify logs are being written:

```bash
# List objects in R2 bucket (requires wrangler)
wrangler r2 object list financial-analysis-logs --prefix http-logs/

# Download a sample log file
wrangler r2 object get financial-analysis-logs http-logs/2025-10-21/log-file.json.gz
gunzip log-file.json.gz
head -n 10 log-file.json
```

## Log Format

Each log entry is a JSON object with the selected fields:

```json
{
  "ClientIP": "203.0.113.1",
  "ClientRequestHost": "api.example.com",
  "ClientRequestMethod": "POST",
  "ClientRequestPath": "/v1/api/chat/enhanced",
  "ClientRequestUserAgent": "Mozilla/5.0...",
  "EdgeResponseStatus": 200,
  "EdgeStartTimestamp": "2025-10-21T12:00:00Z",
  "EdgeEndTimestamp": "2025-10-21T12:00:01Z",
  "RayID": "7d8e9f0a1b2c3d4e",
  "WAFAction": "challenge",
  "WAFRuleID": "100001",
  "ClientCountry": "US"
}
```

## Daily Analysis Job

Once logs are flowing to R2, deploy the daily analysis Worker to identify top offenders. See `../src/cron/analyze-logs.ts` for implementation.

## Cost Estimate

- Logpush: Free (included in paid Cloudflare plans)
- R2 storage: ~$0.015/GB/month
- R2 Class A operations (writes): $4.50 per million requests
- Estimated cost for moderate traffic (~1M requests/day): **$5-15/month**

## Retention Policy

Configure lifecycle rules in R2 to auto-delete old logs:

```bash
# Via Wrangler (coming soon) or Cloudflare dashboard
# Recommended: Keep logs for 90 days, then auto-delete
```

## Next Steps

1. Create Logpush job using one of the methods above
2. Wait 5-15 minutes for first logs to appear
3. Deploy the daily analysis Worker (see `../src/cron/analyze-logs.ts`)
4. Set up alerts based on analysis results
