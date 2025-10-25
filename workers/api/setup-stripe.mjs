#!/usr/bin/env node

/**
 * Stripe Setup Helper
 * 
 * Interactive script to help configure Stripe integration.
 */

import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Stripe Integration Setup Helper\n');
  console.log('This script will guide you through setting up Stripe integration.\n');
  
  // Step 1: Environment selection
  console.log('Step 1: Select Environment');
  console.log('  1) Production (recommended)');
  console.log('  2) Development (for testing)\n');
  
  const envChoice = await question('Choose environment (1 or 2): ');
  const environment = envChoice.trim() === '2' ? 'development' : 'production';
  const envFlag = environment === 'production' ? '--env production' : '';
  
  console.log(`\n✓ Using ${environment} environment\n`);
  
  // Step 2: Get Stripe Secret Key
  console.log('Step 2: Stripe Secret Key');
  console.log(`  Go to: https://dashboard.stripe.com/apikeys`);
  console.log(`  Copy your ${environment === 'production' ? 'Live' : 'Test'} Secret Key (starts with sk_${environment === 'production' ? 'live' : 'test'}_)\n`);
  
  const secretKey = await question('Paste your Stripe Secret Key: ');
  const secretKeyPrefix = secretKey.trim().substring(0, 7);
  
  if (!secretKey.trim()) {
    console.log('\n❌ Secret key is required. Exiting.\n');
    process.exit(1);
  }
  
  console.log(`\n✓ Secret key detected: ${secretKeyPrefix}...\n`);
  
  // Step 3: Get Webhook Secret
  console.log('Step 3: Webhook Signing Secret');
  console.log('  Go to: https://dashboard.stripe.com/webhooks');
  console.log('  Create webhook endpoint: https://fanalyx-api-production.blakeoxford.workers.dev/v1/stripe/webhook');
  console.log('  Select events: customer.subscription.*, invoice.payment_*');
  console.log('  Copy the signing secret (starts with whsec_)\n');
  
  const webhookSecret = await question('Paste your Webhook Signing Secret: ');
  
  if (!webhookSecret.trim()) {
    console.log('\n❌ Webhook secret is required. Exiting.\n');
    process.exit(1);
  }
  
  console.log('\n✓ Webhook secret configured\n');
  
  // Step 4: Get Price IDs
  console.log('Step 4: Product Price IDs');
  console.log('  Go to: https://dashboard.stripe.com/products');
  console.log('  Create two products:');
  console.log('    - Pro Tier: $29/month');
  console.log('    - Enterprise Tier: $299/month');
  console.log('  Copy the Price IDs (starts with price_)\n');
  
  const proPriceId = await question('Pro Tier Price ID (or press Enter to skip): ');
  const enterprisePriceId = await question('Enterprise Tier Price ID (or press Enter to skip): ');
  
  // Step 5: Base URL
  console.log('\nStep 5: Base URL');
  const baseUrl = await question('Base URL for redirects (default: https://fanalyx.com): ');
  const finalBaseUrl = baseUrl.trim() || 'https://fanalyx.com';
  
  console.log('\n\n===========================================');
  console.log('📋 Configuration Summary');
  console.log('===========================================\n');
  console.log(`Environment: ${environment}`);
  console.log(`Secret Key: ${secretKeyPrefix}...`);
  console.log(`Webhook Secret: whsec_...`);
  if (proPriceId.trim()) console.log(`Pro Price ID: ${proPriceId.trim()}`);
  if (enterprisePriceId.trim()) console.log(`Enterprise Price ID: ${enterprisePriceId.trim()}`);
  console.log(`Base URL: ${finalBaseUrl}`);
  console.log('\n===========================================\n');
  
  const confirm = await question('Apply this configuration? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Configuration cancelled.\n');
    process.exit(0);
  }
  
  console.log('\n🚀 Setting Wrangler secrets...\n');
  
  // Generate commands
  const commands = [
    `echo "${secretKey.trim()}" | npx wrangler secret put STRIPE_SECRET_KEY ${envFlag}`,
    `echo "${webhookSecret.trim()}" | npx wrangler secret put STRIPE_WEBHOOK_SECRET ${envFlag}`,
  ];
  
  if (proPriceId.trim()) {
    commands.push(`echo "${proPriceId.trim()}" | npx wrangler secret put STRIPE_PRICE_PRO ${envFlag}`);
  }
  
  if (enterprisePriceId.trim()) {
    commands.push(`echo "${enterprisePriceId.trim()}" | npx wrangler secret put STRIPE_PRICE_ENTERPRISE ${envFlag}`);
  }
  
  commands.push(`echo "${finalBaseUrl}" | npx wrangler secret put BASE_URL ${envFlag}`);
  
  console.log('Run these commands:\n');
  commands.forEach((cmd, i) => {
    console.log(`${i + 1}. ${cmd}`);
  });
  
  console.log('\n\nOr copy/paste this to run all at once:\n');
  console.log(commands.join(' && \\\n  '));
  console.log('\n');
  
  console.log('===========================================');
  console.log('✅ Setup Complete!');
  console.log('===========================================\n');
  console.log('Next steps:');
  console.log('  1. Run the commands above to set secrets');
  console.log('  2. Deploy: npx wrangler deploy --env production');
  console.log('  3. Test webhook: stripe listen --forward-to http://localhost:8787/v1/stripe/webhook');
  console.log('  4. Create test subscription in Stripe Dashboard\n');
  console.log('Documentation: docs/STRIPE_INTEGRATION.md\n');
  
  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
