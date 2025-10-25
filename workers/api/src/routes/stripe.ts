/**
 * Stripe integration routes
 */

import { Router } from 'itty-router';
import type { Env } from '../types';
import {
  handleStripeWebhook,
  createCheckoutSession,
  createPortalSession,
  STRIPE_PRODUCTS,
} from '../lib/stripe';
import type { ApiTier } from '../lib/auth';

export const stripeRouter = Router({ base: '/v1/stripe' });

/**
 * POST /v1/stripe/webhook
 * Handle Stripe webhook events (subscriptions, payments, etc.)
 */
stripeRouter.post('/webhook', async (request: Request, env: Env) => {
  return handleStripeWebhook(request, env);
});

/**
 * POST /v1/stripe/create-checkout
 * Create a Stripe Checkout session for subscribing to a tier
 * 
 * Body: {
 *   tier: "pro" | "enterprise",
 *   customerId: "cus_123",
 *   customerEmail: "user@example.com"
 * }
 */
stripeRouter.post('/create-checkout', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      tier: ApiTier;
      customerId: string;
      customerEmail: string;
    };

    const { tier, customerId, customerEmail } = body;

    // Validate tier
    if (!['pro', 'enterprise'].includes(tier)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid tier. Must be "pro" or "enterprise".',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(tier, customerId, customerEmail, env);

    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create checkout session',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: checkoutUrl,
        tier,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Stripe] Checkout creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid request body',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * POST /v1/stripe/create-portal
 * Create a Stripe Customer Portal session for managing subscriptions
 * 
 * Body: {
 *   customerId: "cus_123"
 * }
 */
stripeRouter.post('/create-portal', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as { customerId: string };
    const { customerId } = body;

    if (!customerId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'customerId is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create portal session
    const portalUrl = await createPortalSession(customerId, env);

    if (!portalUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create portal session. Customer may not have a Stripe account.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: portalUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Stripe] Portal creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid request body',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * GET /v1/stripe/pricing
 * Get available subscription tiers and pricing
 */
stripeRouter.get('/pricing', async () => {
  const pricing = Object.values(STRIPE_PRODUCTS)
    .filter(p => p.tier !== 'test') // Don't expose test tier publicly
    .map(p => ({
      tier: p.tier,
      name: p.name,
      monthlyPrice: p.monthlyPrice,
      monthlyQuota: p.monthlyQuota,
      rateLimitPerSec: p.rateLimitPerSec,
      overagePerRequest: p.overagePerRequest,
      pricePerRequest: p.monthlyPrice > 0 ? (p.monthlyPrice / p.monthlyQuota).toFixed(4) : '0',
    }));

  return new Response(
    JSON.stringify({
      success: true,
      pricing,
      currency: 'USD',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
