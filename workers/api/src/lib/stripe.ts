/**
 * Stripe Integration for API Monetization
 * 
 * Handles subscription management, webhook processing, and usage-based billing.
 */

import type { Env } from '../types';
import type { ApiTier } from './auth';

interface StripeEvent {
  type: string;
  data: {
    object: StripeSubscription | StripeInvoice;
  };
}

interface StripeSubscription {
  id: string;
  customer: string;
  customer_email?: string;
  status: string;
  items: {
    data: Array<{
      price: { id: string };
    }>;
  };
}

interface StripeInvoice {
  customer: string;
}

interface StripeSession {
  url: string;
}

export interface StripeProduct {
  id: string;
  name: string;
  tier: ApiTier;
  priceId: string;
  monthlyPrice: number;
  monthlyQuota: number;
  rateLimitPerSec: number;
  overagePerRequest: number; // cents per request over quota
}

/**
 * Stripe product/price configuration mapping to API tiers
 * These should match your Stripe Dashboard product setup
 */
export const STRIPE_PRODUCTS: Record<ApiTier, StripeProduct> = {
  free: {
    id: 'prod_free',
    name: 'Free Tier',
    tier: 'free',
    priceId: '', // No Stripe price for free tier
    monthlyPrice: 0,
    monthlyQuota: 1_000,
    rateLimitPerSec: 1,
    overagePerRequest: 0.01, // 1 cent per request
  },
  pro: {
    id: 'prod_pro',
    name: 'Pro Tier',
    tier: 'pro',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    monthlyPrice: 2900, // $29.00
    monthlyQuota: 50_000,
    rateLimitPerSec: 10,
    overagePerRequest: 0.001, // 0.1 cent per request
  },
  enterprise: {
    id: 'prod_enterprise',
    name: 'Enterprise Tier',
    tier: 'enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    monthlyPrice: 29900, // $299.00
    monthlyQuota: 1_000_000,
    rateLimitPerSec: 100,
    overagePerRequest: 0.0001, // 0.01 cent per request
  },
  test: {
    id: 'prod_test',
    name: 'Test Tier',
    tier: 'test',
    priceId: '', // No Stripe price for test tier
    monthlyPrice: 0,
    monthlyQuota: 10_000,
    rateLimitPerSec: 5,
    overagePerRequest: 0,
  },
  internal: {
    id: 'prod_internal',
    name: 'Internal Tier',
    tier: 'internal',
    priceId: '', // No Stripe price for internal tier
    monthlyPrice: 0,
    monthlyQuota: 100_000,
    rateLimitPerSec: 1000,
    overagePerRequest: 0,
  },
};

/**
 * Verify Stripe webhook signature
 */
export async function verifyStripeWebhook(
  request: Request,
  secret: string
): Promise<boolean> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return false;

  const body = await request.text();
  const elements = signature.split(',');
  const timestampElement = elements.find(e => e.startsWith('t='));
  const signatureElement = elements.find(e => e.startsWith('v1='));

  if (!timestampElement || !signatureElement) return false;

  const timestamp = timestampElement.split('=')[1];
  const receivedSignature = signatureElement.split('=')[1];

  // Create signed payload
  const signedPayload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature_bytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSignature = Array.from(new Uint8Array(signature_bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare signatures
  if (expectedSignature !== receivedSignature) return false;

  // Check timestamp tolerance (5 minutes)
  const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp || '0');
  if (timestampAge > 300) return false;

  return true;
}

/**
 * Process Stripe webhook event
 */
export async function handleStripeWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Stripe webhook secret not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify webhook signature
  const isValid = await verifyStripeWebhook(request, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid webhook signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse event
  const event = await request.json() as StripeEvent;
  console.log(`[Stripe Webhook] Event type: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as StripeSubscription, env);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as StripeSubscription, env);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object as StripeInvoice, env);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object as StripeInvoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionUpdate(subscription: StripeSubscription, env: Env): Promise<void> {
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price.id;
  const status = subscription.status;

  if (!priceId) {
    console.error('[Stripe] No price ID found in subscription');
    return;
  }

  // Find tier by price ID
  const tier = findTierByPriceId(priceId);
  if (!tier) {
    console.error(`[Stripe] Unknown price ID: ${priceId}`);
    return;
  }

  const product = STRIPE_PRODUCTS[tier];

  // Update or create API key for this customer
  if (status === 'active' || status === 'trialing') {
    await env.DB?.prepare(`
      INSERT INTO api_keys (
        key_hash, key_prefix, customer_id, customer_email, tier,
        active, monthly_quota, rate_limit_per_sec, metadata
      )
      SELECT ?, ?, ?, ?, ?, 1, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM api_keys WHERE customer_id = ? AND active = 1
      )
    `).bind(
      '', // Will be set when key is generated via API
      '',
      customerId,
      subscription.customer_email || '',
      tier,
      product.monthlyQuota,
      product.rateLimitPerSec,
      JSON.stringify({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        price_id: priceId,
      }),
      customerId
    ).run();

    // Update existing key tier if customer already has one
    await env.DB?.prepare(`
      UPDATE api_keys
      SET tier = ?,
          monthly_quota = ?,
          rate_limit_per_sec = ?,
          metadata = json_set(
            COALESCE(metadata, '{}'),
            '$.stripe_subscription_id', ?,
            '$.stripe_customer_id', ?,
            '$.price_id', ?
          )
      WHERE customer_id = ? AND active = 1
    `).bind(
      tier,
      product.monthlyQuota,
      product.rateLimitPerSec,
      subscription.id,
      customerId,
      priceId,
      customerId
    ).run();

    console.log(`[Stripe] Updated customer ${customerId} to ${tier} tier`);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(subscription: StripeSubscription, env: Env): Promise<void> {
  const customerId = subscription.customer;

  // Downgrade to free tier
  const freeProduct = STRIPE_PRODUCTS.free;
  await env.DB?.prepare(`
    UPDATE api_keys
    SET tier = 'free',
        monthly_quota = ?,
        rate_limit_per_sec = ?,
        metadata = json_remove(
          COALESCE(metadata, '{}'),
          '$.stripe_subscription_id'
        )
    WHERE customer_id = ? AND active = 1
  `).bind(
    freeProduct.monthlyQuota,
    freeProduct.rateLimitPerSec,
    customerId
  ).run();

  console.log(`[Stripe] Downgraded customer ${customerId} to free tier`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(invoice: StripeInvoice, env: Env): Promise<void> {
  const customerId = invoice.customer;
  console.log(`[Stripe] Payment succeeded for customer ${customerId}`);

  // Reset usage tracking for new billing period
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await env.DB?.prepare(`
    UPDATE api_key_usage_monthly
    SET total_requests = 0,
        successful_requests = 0,
        failed_requests = 0,
        total_response_time_ms = 0,
        total_tokens_used = 0,
        total_cost_cents = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE api_key_id IN (
      SELECT id FROM api_keys WHERE customer_id = ? AND active = 1
    ) AND year_month = ?
  `).bind(customerId, yearMonth).run();
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(invoice: StripeInvoice): Promise<void> {
  const customerId = invoice.customer;
  console.log(`[Stripe] Payment failed for customer ${customerId}`);

  // Optionally suspend API access
  // Note: Uncomment and add env parameter if you want to suspend access on payment failure
  // await env.DB?.prepare(`
  //   UPDATE api_keys SET active = 0
  //   WHERE customer_id = ? AND tier != 'free'
  // `).bind(customerId).run();
}

/**
 * Find API tier by Stripe price ID
 */
function findTierByPriceId(priceId: string): ApiTier | null {
  for (const [tier, product] of Object.entries(STRIPE_PRODUCTS)) {
    if (product.priceId === priceId) {
      return tier as ApiTier;
    }
  }
  return null;
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  tier: ApiTier,
  customerId: string,
  customerEmail: string,
  env: Env
): Promise<string | null> {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not configured');
  }

  const product = STRIPE_PRODUCTS[tier];
  if (!product.priceId) {
    throw new Error(`No Stripe price configured for tier: ${tier}`);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'subscription',
      'customer_email': customerEmail,
      'client_reference_id': customerId,
      'line_items[0][price]': product.priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${env.BASE_URL || 'https://fanalyx.com'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${env.BASE_URL || 'https://fanalyx.com'}/pricing`,
      'metadata[customer_id]': customerId,
      'metadata[tier]': tier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Stripe] Checkout session creation failed:', error);
    return null;
  }

  const session = await response.json() as StripeSession;
  return session.url;
}

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  env: Env
): Promise<string | null> {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not configured');
  }

  // Get Stripe customer ID from API key metadata
  const result = await env.DB?.prepare(`
    SELECT metadata FROM api_keys
    WHERE customer_id = ? AND active = 1
    LIMIT 1
  `).bind(customerId).first<{ metadata: string }>();

  if (!result?.metadata) {
    return null;
  }

  const metadata = JSON.parse(result.metadata);
  const stripeCustomerId = metadata.stripe_customer_id;

  if (!stripeCustomerId) {
    return null;
  }

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'customer': stripeCustomerId,
      'return_url': `${env.BASE_URL || 'https://fanalyx.com'}/dashboard`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Stripe] Portal session creation failed:', error);
    return null;
  }

  const session = await response.json() as StripeSession;
  return session.url;
}

/**
 * Calculate overage charges for usage beyond monthly quota
 */
export async function calculateOverageCharges(
  apiKeyId: number,
  yearMonth: string,
  env: Env
): Promise<number> {
  // Get key info and usage
  const keyResult = await env.DB?.prepare(`
    SELECT tier, monthly_quota FROM api_keys WHERE id = ?
  `).bind(apiKeyId).first<{ tier: ApiTier; monthly_quota: number }>();

  if (!keyResult) return 0;

  const usageResult = await env.DB?.prepare(`
    SELECT total_requests FROM api_key_usage_monthly
    WHERE api_key_id = ? AND year_month = ?
  `).bind(apiKeyId, yearMonth).first<{ total_requests: number }>();

  if (!usageResult) return 0;

  const product = STRIPE_PRODUCTS[keyResult.tier];
  const overage = Math.max(0, usageResult.total_requests - keyResult.monthly_quota);
  const overageCents = Math.ceil(overage * product.overagePerRequest);

  return overageCents;
}

/**
 * Report usage to Stripe for usage-based billing
 */
export async function reportUsageToStripe(
  apiKeyId: number,
  quantity: number,
  env: Env
): Promise<void> {
  if (!env.STRIPE_SECRET_KEY) return;

  // Get subscription item ID from metadata
  const result = await env.DB?.prepare(`
    SELECT metadata FROM api_keys WHERE id = ?
  `).bind(apiKeyId).first<{ metadata: string }>();

  if (!result?.metadata) return;

  const metadata = JSON.parse(result.metadata);
  const subscriptionItemId = metadata.stripe_subscription_item_id;

  if (!subscriptionItemId) return;

  // Create usage record
  await fetch('https://api.stripe.com/v1/subscription_items/' + subscriptionItemId + '/usage_records', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'quantity': quantity.toString(),
      'timestamp': Math.floor(Date.now() / 1000).toString(),
      'action': 'increment',
    }),
  });
}
