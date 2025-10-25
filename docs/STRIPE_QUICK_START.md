# Stripe Integration - Quick Start

## 🎯 You Have Your Stripe Account - Now What?

### Step 1: Copy Your Stripe Keys

From your Stripe Dashboard (<https://dashboard.stripe.com>):

1. **Get Secret Key**
   - Go to Developers → API keys
   - Copy "Secret key" (starts with `sk_live_...` or `sk_test_...`)

2. **Create Webhook Endpoint**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/webhook`
   - Events to send:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`  
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
   - Copy "Signing secret" (starts with `whsec_...`)

3. **Create Products** (optional - defaults are set)
   - Go to Products → Add product
   - Pro Tier: $29/month → Copy Price ID
   - Enterprise: $299/month → Copy Price ID

### Step 2: Set Secrets in Cloudflare

```bash
cd /Users/blakepowell/Documents/GitHub/financial-analysis/workers/api

# Required secrets
npx wrangler secret put STRIPE_SECRET_KEY --env production
# Paste: sk_live_...

npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
# Paste: whsec_...

# Optional (if you created custom products)
npx wrangler secret put STRIPE_PRICE_PRO --env production
npx wrangler secret put STRIPE_PRICE_ENTERPRISE --env production

# Base URL for redirects
npx wrangler secret put BASE_URL --env production
# Enter: https://fanalyx.com
```

### Step 3: Deploy

```bash
npx wrangler deploy --env production
```

### Step 4: Test It! 🎉

```bash
# 1. Get pricing
curl https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/pricing | jq .

# 2. Create checkout session (replace with your customer data)
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "pro",
    "customerId": "test_customer_123",
    "customerEmail": "blake@example.com"
  }' | jq .

# You'll get a checkout URL - open it in browser!

# 3. Create portal session (after customer has subscription)
curl -X POST https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-portal \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test_customer_123"
  }' | jq .
```

## 🔄 What Happens Automatically

When a user subscribes via Stripe Checkout:

1. ✅ Stripe sends webhook to your API
2. ✅ API verifies signature
3. ✅ API finds/creates customer's API key  
4. ✅ API upgrades tier (Pro/Enterprise)
5. ✅ API updates quota (50K or 1M requests/month)
6. ✅ API updates rate limit (10 or 100 req/sec)
7. ✅ User can immediately use API with new limits!

When a user cancels:

1. ✅ Stripe sends cancellation webhook
2. ✅ API downgrades to free tier (1K/month, 1 req/sec)
3. ✅ API key remains active but with lower limits

## 📊 Current Pricing Tiers

| Tier | Price | Requests/mo | Rate Limit | Overage |
|------|-------|-------------|------------|---------|
| Free | $0 | 1,000 | 1/sec | $0.01/req |
| Pro | $29 | 50,000 | 10/sec | $0.001/req |
| Enterprise | $299 | 1,000,000 | 100/sec | $0.0001/req |

## 🎨 Add to Your Website

```html
<!-- Pricing page button -->
<button onclick="subscribe('pro')">Subscribe to Pro - $29/mo</button>

<script>
async function subscribe(tier) {
  const response = await fetch('https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier: tier,
      customerId: user.id,
      customerEmail: user.email
    })
  });
  
  const data = await response.json();
  if (data.success) {
    window.location.href = data.url; // Redirect to Stripe
  }
}

async function manageBilling() {
  const response = await fetch('https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: user.id })
  });
  
  const data = await response.json();
  if (data.success) {
    window.location.href = data.url; // Redirect to Customer Portal
  }
}
</script>
```

## 🐛 Troubleshooting

**Webhook not working?**

```bash
# Check if endpoint is accessible
curl https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/webhook

# View logs
npx wrangler tail --env production | grep Stripe
```

**Tier not upgrading?**

```bash
# Check secrets are set
npx wrangler secret list --env production

# Should show:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
```

**Test locally:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local dev
stripe listen --forward-to http://localhost:8787/v1/stripe/webhook

# In another terminal, start dev server
pnpm --filter @financial-analysis/api dev

# Trigger test event
stripe trigger customer.subscription.created
```

## 📚 Full Documentation

See [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md) for complete guide including:

- Frontend integration examples (React, Next.js)
- Database schema details
- Security best practices
- Monitoring and analytics
- Advanced usage scenarios

## 🚀 You're All Set!

Your API now has full Stripe integration with:

- ✅ Subscription management
- ✅ Automatic tier upgrades/downgrades  
- ✅ Customer portal for self-service
- ✅ Webhook processing
- ✅ Usage-based billing ready

**Next**: Add pricing page to your website and start accepting subscriptions! 💰
