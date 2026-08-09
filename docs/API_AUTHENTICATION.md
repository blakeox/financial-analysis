# API Authentication & Monetization System

## Overview

This document describes the implementation of the API key authentication and monetization system for the Financial Analysis API.

## Architecture

### Components

1. **Database Schema** (`schema.sql`)
   - `api_keys`: Stores API keys with tier, quota, and rate limit info
   - `api_key_usage`: Detailed per-request usage logs
   - `api_key_usage_monthly`: Aggregated monthly usage for fast dashboard queries

2. **Authentication Module** (`src/lib/auth.ts`)
   - API key generation and validation
   - Rate limiting (per-second) using KV storage
   - Monthly quota tracking using D1
   - Automatic usage tracking

3. **API Key Management Routes** (`src/routes/api-keys.ts`)
   - `POST /v1/keys` - Create new API key
   - `GET /v1/keys?customerId={id}` - List customer's keys
   - `DELETE /v1/keys/:keyId` - Revoke an API key
   - `GET /v1/keys/:keyId/usage` - Get usage statistics

4. **Middleware** (`src/index.ts`)
   - `withAuth()` - Wraps protected routes with authentication
   - Validates API keys, enforces rate limits and quotas
   - Automatically tracks usage for billing/analytics

## API Key Format

API keys follow the format: `fk_{env}_{32_random_chars}`

- `fk` = Fanalyx key
- `env` = `test` or `live`
- 32 chars = base62-encoded random bytes

Examples:

- Test: `fk_test_A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6`
- Live: `fk_live_Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4`

## Tier Configuration

### Free Tier

- Monthly Quota: 1,000 requests
- Rate Limit: 1 request/second
- Cost: $0/month

### Pro Tier

- Monthly Quota: 50,000 requests
- Rate Limit: 10 requests/second
- Cost: $49/month

### Enterprise Tier

- Monthly Quota: 1,000,000 requests
- Rate Limit: 100 requests/second
- Cost: Custom pricing

### Test Tier

- Monthly Quota: 10,000 requests
- Rate Limit: 5 requests/second
- Cost: Free (for development/testing)

## Authentication Flow

1. **Request arrives** with `Authorization: Bearer <key>` or `X-API-Key: <key>` header
2. **Extract key** from headers
3. **Validate format** (must match `fk_(test|live)_[A-Za-z0-9]{32}`)
4. **Hash key** using SHA-256
5. **Look up in database** by hash
6. **Check status** (active/revoked)
7. **Check monthly quota** from `api_key_usage_monthly` table
8. **Check rate limit** using KV sliding window (1-second buckets)
9. **Execute handler** if all checks pass
10. **Track usage** asynchronously (don't block response)
11. **Return response** with rate limit headers

## Rate Limiting Algorithm

Uses sliding window with KV storage:

```typescript
// 1-second buckets
const bucketSize = 1000; // ms
const currentBucket = Math.floor(Date.now() / bucketSize);

// Count requests in current bucket
const key = `rate_limit:{keyId}:{bucketTimestamp}`;
const count = await KV.get(key);

// Allow if under limit
if (count < rateLimitPerSec) {
  await KV.put(key, count + 1, { expirationTtl: 2 });
  // proceed
} else {
  return 429 Rate Limited
}
```

## Usage Tracking

### Per-Request Tracking

Every API request is logged to `api_key_usage` table with:

- Endpoint called
- HTTP method and status code
- Response time (ms)
- IP address and user agent
- Timestamp

### Monthly Aggregation

Simultaneously upserted to `api_key_usage_monthly`:

- Total requests
- Successful vs failed requests
- Total response time (for avg calculation)
- Total tokens used (for AI endpoints)
- Total cost in cents

## Protected Endpoints

All analysis endpoints now require API key authentication:

- `POST /v1/api/analysis/lease` - Equipment lease analysis
- `POST /v1/api/analysis/enhanced-lease` - Enhanced lease with tax/maintenance
- `POST /v1/api/analysis/amortization` - Loan amortization schedules
- `POST /v1/api/analysis/ebitda-forecast` - EBITDA cash flow forecasting

The programmatic MCP endpoint is also protected in production:

- `POST /mcp` - JSON-RPC financial analysis tools for external AI clients

OAuth 2.1 is staged separately at `POST /oauth/mcp` and remains disabled by
default. It uses a separate `OAUTH_KV` namespace, validates a configured
Cloudflare Access or generic OIDC identity for the resource owner, and
advertises only `analysis:read` initially. Consent is explicit and
CSRF-protected.
The resource owner can manage active grants at `GET /oauth/grants` and
`DELETE /oauth/grants/:grantId`.
See [`docs/OAUTH_CLIENT_SETUP.md`](./OAUTH_CLIENT_SETUP.md) for the MCP client
registration and callback rules, and [`docs/OAUTH_ROLLOUT.md`](./OAUTH_ROLLOUT.md)
for the enablement gate.

## API Key Management

### Create API Key

```bash
POST /v1/keys
Content-Type: application/json

{
  "customerEmail": "user@example.com",
  "customerId": "cus_1234567890",
  "tier": "pro",
  "description": "Production API key for financial dashboard",
  "mcpScopes": ["analysis:read"]
}
```

`mcpScopes` is optional for backwards compatibility. When omitted, the key
receives `analysis:read`; when supplied, only recognized scopes are honored.
Scope grants are managed through the admin-protected key lifecycle routes.

Response:

```json
{
  "success": true,
  "key": "fk_live_ABC123...", // Only shown once!
  "keyPrefix": "fk_live_ABC1",
  "tier": "pro",
  "monthlyQuota": 50000,
  "rateLimitPerSec": 10,
  "message": "Store this API key securely. It will not be shown again."
}
```

### List API Keys

```bash
GET /v1/keys?customerId=cus_1234567890
```

Response:

```json
{
  "success": true,
  "keys": [
    {
      "id": 1,
      "keyPrefix": "fk_live_ABC1",
      "customerEmail": "user@example.com",
      "tier": "pro",
      "active": true,
      "monthlyQuota": 50000,
      "rateLimitPerSec": 10,
      "createdAt": "2025-10-22T10:30:00Z",
      "lastUsedAt": "2025-10-22T12:45:00Z",
      "metadata": { "description": "Production API key" }
    }
  ],
  "total": 1
}
```

### Revoke API Key

```bash
DELETE /v1/keys/1
```

Response:

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

### Get Usage Statistics

```bash
GET /v1/keys/1/usage
```

Response:

```json
{
  "success": true,
  "currentMonth": {
    "yearMonth": "2025-10",
    "totalRequests": 12543,
    "successfulRequests": 12501,
    "failedRequests": 42,
    "avgResponseTime": 87,
    "totalTokensUsed": 0,
    "totalCostCents": 0
  },
  "quota": {
    "limit": 50000,
    "used": 12543,
    "remaining": 37457,
    "percentUsed": 25.09
  },
  "tier": "pro",
  "recentRequests": [
    {
      "endpoint": "/v1/api/analysis/amortization",
      "method": "POST",
      "status_code": 200,
      "response_time_ms": 92,
      "created_at": "2025-10-22T12:45:32Z"
    }
    // ... last 100 requests in 24 hours
  ]
}
```

## Using the API with Authentication

### cURL Example

```bash
curl -X POST https://fanalyx.com/v1/api/analysis/amortization \
  -H "Authorization: Bearer fk_live_ABC123..." \
  -H "Content-Type: application/json" \
  -d '{
    "principal": 250000,
    "annualRate": 0.045,
    "termMonths": 360
  }'
```

### JavaScript Example

```javascript
const response = await fetch('https://fanalyx.com/v1/api/analysis/amortization', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer fk_live_ABC123...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    principal: 250000,
    annualRate: 0.045,
    termMonths: 360,
  }),
});

const data = await response.json();
console.log(data.monthlyPayment);
```

### Python Example

```python
import requests

response = requests.post(
    'https://fanalyx.com/v1/api/analysis/amortization',
    headers={
        'Authorization': 'Bearer fk_live_ABC123...',
        'Content-Type': 'application/json',
    },
    json={
        'principal': 250000,
        'annualRate': 0.045,
        'termMonths': 360,
    }
)

data = response.json()
print(data['monthlyPayment'])
```

## Error Responses

### 401 Unauthorized - Missing/Invalid Key

```json
{
  "error": "API key required. Provide via Authorization: Bearer <key> or X-API-Key: <key> header.",
  "code": "MISSING_KEY",
  "timestamp": "2025-10-22T12:45:32Z"
}
```

### 401 Unauthorized - Revoked Key

```json
{
  "error": "API key has been revoked.",
  "code": "REVOKED_KEY",
  "timestamp": "2025-10-22T12:45:32Z"
}
```

### 403 Forbidden - Quota Exceeded

```json
{
  "error": "Monthly quota exceeded. Used 50000/50000 requests.",
  "code": "QUOTA_EXCEEDED",
  "timestamp": "2025-10-22T12:45:32Z"
}
```

### 429 Too Many Requests - Rate Limited

```json
{
  "error": "Rate limit exceeded. Maximum 10 requests per second.",
  "code": "RATE_LIMITED",
  "timestamp": "2025-10-22T12:45:32Z"
}
```

## Response Headers

All authenticated responses include these headers:

- `X-RateLimit-Limit`: Maximum requests per second for your tier
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-API-Key-Tier`: Your current tier (free, pro, enterprise, test)

## Database Setup

Run the schema to create tables:

```bash
npx wrangler d1 execute financial-analysis-db --file=./schema.sql --remote
```

## Next Steps

### Immediate (MVP Ready)

- ✅ Database schema created
- ✅ Authentication module implemented
- ✅ API key management routes created
- ✅ Analysis endpoints protected with auth
- ✅ Rate limiting implemented
- ✅ Usage tracking implemented

### Short Term (Production Ready)

- [ ] Run database migrations on production D1
- [ ] Create test API keys for development
- [ ] Add admin dashboard UI for key management
- [ ] Implement Stripe integration for billing
- [ ] Add webhook events (quota warnings, key revoked)
- [ ] Build usage dashboard page (/dashboard)

### Medium Term (Scale & Polish)

- [ ] Build actual SDK packages (@fanalyx/sdk, fanalyx PyPI)
- [ ] Create interactive API playground (/playground)
- [ ] Add more granular usage analytics
- [ ] Implement cost calculation for AI endpoints
- [ ] Add support for team/org-level keys
- [ ] Build migration tools for users upgrading tiers

### Long Term (Enterprise Features)

- [ ] Custom rate limits per customer
- [ ] Dedicated infrastructure for enterprise
- [ ] SLA monitoring and guarantees
- [ ] Priority support channels
- [ ] Advanced analytics and reporting
- [ ] Webhook delivery retry logic

## Security Considerations

1. **Key Storage**: Only SHA-256 hashes stored in database, never plaintext keys
2. **Key Display**: Full key only shown once at creation time
3. **HTTPS Only**: All API requests must use TLS
4. **Rate Limiting**: Prevents abuse and ensures fair usage
5. **Quota Tracking**: Prevents runaway usage and surprise bills
6. **Audit Logs**: All requests logged for security analysis
7. **Key Revocation**: Instant revocation via DELETE endpoint
8. **IP Tracking**: Request origins logged for fraud detection

## Performance

- **Authentication**: < 5ms (KV+D1 lookups)
- **Rate Limit Check**: < 2ms (KV only)
- **Usage Tracking**: Async, doesn't block response
- **Quota Check**: < 5ms (D1 aggregate query)

Total auth overhead: ~10-15ms per request

## Monitoring

Key metrics to track:

- **Auth success rate**: Should be > 99%
- **Rate limit hit rate**: Track if limits too restrictive
- **Quota usage patterns**: Identify customers nearing limits
- **Failed auth attempts**: Monitor for brute force attacks
- **Average response time**: Should stay < 100ms for most endpoints
- **Monthly revenue**: Track MRR from API subscriptions

## Testing

### Create Test Key

```bash
curl -X POST http://localhost:8787/v1/keys \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerId": "test_001",
    "tier": "test"
  }'
```

### Test Authentication

```bash
# Should succeed
curl -X POST http://localhost:8787/v1/api/analysis/amortization \
  -H "Authorization: Bearer fk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"principal":100000,"annualRate":0.05,"termMonths":360}'

# Should fail with 401
curl -X POST http://localhost:8787/v1/api/analysis/amortization \
  -H "Content-Type: application/json" \
  -d '{"principal":100000,"annualRate":0.05,"termMonths":360}'
```

### Test Rate Limiting

```bash
# Send rapid requests (should hit 429 after exceeding tier limit)
for i in {1..20}; do
  curl -X POST http://localhost:8787/v1/api/analysis/amortization \
    -H "Authorization: Bearer fk_test_..." \
    -H "Content-Type: application/json" \
    -d '{"principal":100000,"annualRate":0.05,"termMonths":360}' &
done
wait
```
