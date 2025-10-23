# Stripe Integration Guide

Complete guide for integrating Stripe payment processing with the Financial Analysis API.

## Overview

The API now includes full Stripe integration for subscription management, automated tier upgrades/downgrades, and usage-based billing for API monetization.

## Features

- **Subscription Management**: Automatic tier assignment based on Stripe subscriptions
- **Webhook Processing**: Real-time sync of subscription changes
- **Customer Portal**: Self-service subscription management
- **Usage-Based Billing**: Overage charges for requests beyond quota
- **Secure Payment**: Stripe Checkout for PCI-compliant payments

## Quick Setup

### 1. Configure Stripe Secrets

Set your Stripe keys using Wrangler secrets (never commit these to git):

```bash
# Production environment
npx wrangler secret put STRIPE_SECRET_KEY --env production
# Enter your sk_live_... key

npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
# Enter your whsec_... webhook signing secret

# Optional: Custom price IDs (if different from defaults)
npx wrangler secret put STRIPE_PRICE_PRO --env production
npx wrangler secret put STRIPE_PRICE_ENTERPRISE --env production
npx wrangler secret put BASE_URL --env production
# Enter https://fanalyx.com
```

### 2. Create Stripe Products

In your Stripe Dashboard (https://dashboard.stripe.com), create:

**Pro Tier Product**
- Name: "Pro Tier"
- Price: $29.00/month
- Copy the Price ID (e.g., `price_1ABC123...`)

**Enterprise Tier Product**
- Name: "Enterprise Tier"
- Price: $299.00/month
- Copy the Price ID (e.g., `price_1XYZ789...`)

### 3. Configure Webhook Endpoint

In Stripe Dashboard → Developers → Webhooks:

1. **Add endpoint**: `https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/webhook`
2. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. **Copy signing secret** (starts with `whsec_`)
4. Set it via: `npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production`

### 4. Update Price IDs

If your Stripe price IDs differ from defaults, update them:

```typescript
// In workers/api/src/lib/stripe.ts - STRIPE_PRODUCTS
pro: {
  priceId: process.env.STRIPE_PRICE_PRO || 'price_YOUR_ACTUAL_PRO_PRICE_ID',
  // ...
},
enterprise: {
  priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_YOUR_ACTUAL_ENTERPRISE_PRICE_ID',
  // ...
}
```

## API Endpoints

### Create Checkout Session

Create a Stripe Checkout session to subscribe to a tier.

**Request:**
```bash
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "pro",
    "customerId": "cus_abc123",
    "customerEmail": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "tier": "pro"
}
```

Redirect user to the `url` to complete payment.

### Create Customer Portal Session

Create a Stripe Customer Portal session for managing subscriptions.

**Request:**
```bash
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-portal \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_abc123"
  }'
```

**Response:**
```json
{
  "success": true,
  "url": "https://billing.stripe.com/p/session/..."
}
```

Redirect user to the `url` to manage their subscription.

### Get Pricing Information

Retrieve available subscription tiers and pricing.

**Request:**
```bash
curl https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/pricing
```

**Response:**
```json
{
  "success": true,
  "pricing": [
    {
      "tier": "free",
      "name": "Free Tier",
      "monthlyPrice": 0,
      "monthlyQuota": 1000,
      "rateLimitPerSec": 1,
      "overagePerRequest": 0.01,
      "pricePerRequest": "0"
    },
    {
      "tier": "pro",
      "name": "Pro Tier",
      "monthlyPrice": 2900,
      "monthlyQuota": 50000,
      "rateLimitPerSec": 10,
      "overagePerRequest": 0.001,
      "pricePerRequest": "0.0580"
    },
    {
      "tier": "enterprise",
      "name": "Enterprise Tier",
      "monthlyPrice": 29900,
      "monthlyQuota": 1000000,
      "rateLimitPerSec": 100,
      "overagePerRequest": 0.0001,
      "pricePerRequest": "0.0299"
    }
  ],
  "currency": "USD"
}
```

### Webhook Handler

Stripe will POST events to this endpoint. **No authentication required** - signature verification is handled internally.

**Endpoint:** `POST /v1/stripe/webhook`

Handled events:
- `customer.subscription.created` → Create/update API key, set tier
- `customer.subscription.updated` → Update tier and quotas
- `customer.subscription.deleted` → Downgrade to free tier
- `invoice.payment_succeeded` → Reset usage for new billing period
- `invoice.payment_failed` → Log warning (optionally suspend access)

## Subscription Flow

### 1. User Signs Up (Free Tier)

```bash
# Create free API key
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/keys \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "user@example.com",
    "customerId": "cus_new_user_123",
    "tier": "free",
    "description": "Free tier API key"
  }'
```

Response:
```json
{
  "success": true,
  "key": "fk_live_ABC123XYZ789...",
  "tier": "free",
  "monthlyQuota": 1000,
  "rateLimitPerSec": 1
}
```

### 2. User Upgrades to Pro

```bash
# Create checkout session
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "pro",
    "customerId": "cus_new_user_123",
    "customerEmail": "user@example.com"
  }'
```

→ Redirect user to Stripe Checkout  
→ User completes payment  
→ Stripe sends `customer.subscription.created` webhook  
→ API automatically upgrades API key to Pro tier (50K requests/mo, 10 req/sec)

### 3. User Manages Subscription

```bash
# Create portal session
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-portal \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_new_user_123"
  }'
```

→ Redirect user to Stripe Customer Portal  
→ User can upgrade, downgrade, update payment method, view invoices  
→ Changes sync automatically via webhooks

### 4. User Cancels Subscription

User cancels via Customer Portal  
→ Stripe sends `customer.subscription.deleted` webhook  
→ API automatically downgrades to free tier (1K requests/mo, 1 req/sec)  
→ API key remains valid but with lower limits

## Tier Configuration

Current pricing tiers (can be customized in `workers/api/src/lib/stripe.ts`):

| Tier | Monthly Price | Requests/Month | Rate Limit | Overage Cost |
|------|--------------|----------------|------------|--------------|
| Free | $0 | 1,000 | 1/sec | $0.01/req |
| Pro | $29 | 50,000 | 10/sec | $0.001/req |
| Enterprise | $299 | 1,000,000 | 100/sec | $0.0001/req |
| Test | $0 | 10,000 | 5/sec | $0 |

**Overage Example (Pro Tier):**
- User makes 55,000 requests in a month
- Quota: 50,000 included
- Overage: 5,000 requests
- Overage cost: 5,000 × $0.001 = $5.00
- Total invoice: $29.00 + $5.00 = $34.00

## Integration with Frontend

### React Example

```typescript
// Upgrade to Pro tier
async function handleUpgrade() {
  const response = await fetch('/v1/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier: 'pro',
      customerId: user.id,
      customerEmail: user.email,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  }
}

// Manage subscription
async function handleManageSubscription() {
  const response = await fetch('/v1/stripe/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: user.id,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect to Customer Portal
    window.location.href = data.url;
  }
}

// Display pricing
async function loadPricing() {
  const response = await fetch('/v1/stripe/pricing');
  const data = await response.json();
  
  setPricingTiers(data.pricing);
}
```

### Next.js App Router Example

```typescript
// app/pricing/page.tsx
export default async function PricingPage() {
  const response = await fetch(
    'https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/pricing',
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  const data = await response.json();
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {data.pricing.map((tier) => (
        <PricingCard key={tier.tier} tier={tier} />
      ))}
    </div>
  );
}
```

## Database Schema

The Stripe integration uses the existing `api_keys` table with metadata:

```sql
-- metadata column stores Stripe-specific data
{
  "description": "User's API key",
  "stripe_customer_id": "cus_ABC123",
  "stripe_subscription_id": "sub_XYZ789",
  "stripe_subscription_item_id": "si_DEF456", -- For usage reporting
  "price_id": "price_1ABC..."
}
```

## Security Considerations

1. **Webhook Signature Verification**
   - All webhooks are verified using `STRIPE_WEBHOOK_SECRET`
   - Invalid signatures are rejected with 401
   - Timestamp tolerance: 5 minutes

2. **Secrets Management**
   - Never commit Stripe keys to git
   - Use Wrangler secrets for all sensitive data
   - Rotate keys regularly

3. **Customer Data**
   - Stripe customer IDs are stored, not payment methods
   - PCI compliance handled entirely by Stripe
   - User emails are encrypted in transit (HTTPS)

## Testing

### Test Mode

1. Use Stripe test keys (starts with `sk_test_`)
2. Use test webhook secret (starts with `whsec_test_`)
3. Create test products/prices in Stripe Dashboard (test mode)
4. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC

### Webhook Testing

Use Stripe CLI to forward webhooks to local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to http://localhost:8787/v1/stripe/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### Local Testing

```bash
# Set test environment variables
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_test_..."
export STRIPE_PRICE_PRO="price_test_pro"
export STRIPE_PRICE_ENTERPRISE="price_test_enterprise"
export BASE_URL="http://localhost:3000"

# Start API
pnpm --filter @financial-analysis/api dev
```

## Monitoring

### Stripe Dashboard

Monitor in real-time:
- Revenue and MRR (Monthly Recurring Revenue)
- Active subscriptions by tier
- Failed payments and churn
- Webhook delivery status

### API Logs

```bash
# View production logs
npx wrangler tail --env production

# Filter for Stripe events
npx wrangler tail --env production | grep Stripe
```

### Database Queries

```sql
-- Count subscriptions by tier
SELECT tier, COUNT(*) as count
FROM api_keys
WHERE active = 1
  AND tier != 'free'
  AND json_extract(metadata, '$.stripe_subscription_id') IS NOT NULL
GROUP BY tier;

-- Revenue calculation (monthly)
SELECT 
  tier,
  COUNT(*) as subscribers,
  CASE 
    WHEN tier = 'pro' THEN COUNT(*) * 29
    WHEN tier = 'enterprise' THEN COUNT(*) * 299
    ELSE 0
  END as monthly_revenue
FROM api_keys
WHERE active = 1
  AND json_extract(metadata, '$.stripe_subscription_id') IS NOT NULL
GROUP BY tier;
```

## Troubleshooting

### Webhooks Not Working

1. Check webhook endpoint is accessible: `curl https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/webhook`
2. Verify signing secret is set: `npx wrangler secret list --env production`
3. Check Stripe Dashboard → Webhooks → Event logs for delivery status
4. Review API logs: `npx wrangler tail --env production`

### Tier Not Updating

1. Verify price IDs match between code and Stripe Dashboard
2. Check webhook events are being received
3. Verify D1 database has `api_keys` table with customer_id
4. Check customer has an active API key: 
   ```sql
   SELECT * FROM api_keys WHERE customer_id = 'cus_...' AND active = 1;
   ```

### Payment Failures

1. User has insufficient funds → Stripe retry logic handles this
2. Card declined → User notified by Stripe email
3. Subscription may enter `past_due` status → Still active but payment retry in progress
4. After multiple failures → Subscription `canceled` automatically by Stripe

## Next Steps

1. **[DONE]** Stripe integration complete
2. **[TODO]** Create frontend pricing page (`apps/web/src/pages/pricing.astro`)
3. **[TODO]** Add subscription management to user dashboard
4. **[TODO]** Implement usage-based billing with Stripe metered billing
5. **[TODO]** Set up automated dunning emails for failed payments
6. **[TODO]** Create admin dashboard for viewing subscription analytics
7. **[TODO]** Implement webhook event logging to D1 for audit trail

## Related Documentation

- [API Authentication](./API_AUTHENTICATION.md) - API key system
- [API Reference](./API.md) - Complete API documentation
- [Stripe API Docs](https://stripe.com/docs/api) - Official Stripe documentation
- [Stripe Webhooks](https://stripe.com/docs/webhooks) - Webhook integration guide
