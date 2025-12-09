#!/usr/bin/env node
/**
 * Stripe Setup Script
 * Creates the Pro subscription product and price
 * Run once: node scripts/setup-stripe.js
 */

require('dotenv').config();
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('   Add it to your .env file: STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function setupStripe() {
  console.log('🔧 Setting up Stripe products and prices...\n');

  try {
    // Check if product already exists
    const existingProducts = await stripe.products.list({ limit: 10 });
    let product = existingProducts.data.find(p => p.name === 'ConsensusAI Pro');

    if (product) {
      console.log('✅ Product already exists:', product.id);
    } else {
      // Create the Pro product
      product = await stripe.products.create({
        name: 'ConsensusAI Pro',
        description: 'Unlimited AI debates, premium models, priority support',
        metadata: {
          tier: 'pro',
          features: 'unlimited_debates,premium_models,priority_support,cloud_sync'
        }
      });
      console.log('✅ Created product:', product.id);
    }

    // Check if price already exists
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 10 });
    let monthlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 1900);

    if (monthlyPrice) {
      console.log('✅ Monthly price already exists:', monthlyPrice.id);
    } else {
      // Create monthly price ($19/month)
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 1900, // $19.00 in cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan: 'pro_monthly'
        }
      });
      console.log('✅ Created monthly price:', monthlyPrice.id);
    }

    // Check for yearly price
    let yearlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'year' && p.unit_amount === 19000);

    if (yearlyPrice) {
      console.log('✅ Yearly price already exists:', yearlyPrice.id);
    } else {
      // Create yearly price ($190/year - 2 months free)
      yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 19000, // $190.00 in cents
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          plan: 'pro_yearly'
        }
      });
      console.log('✅ Created yearly price:', yearlyPrice.id);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 ADD THESE TO YOUR .env FILE:');
    console.log('='.repeat(60));
    console.log(`STRIPE_PRICE_ID_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_ID_YEARLY=${yearlyPrice.id}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  WEBHOOK SECRET: You need to create a webhook in Stripe Dashboard');
    console.log('   URL: https://your-domain.com/api/stripe/webhook');
    console.log('   Events: checkout.session.completed, customer.subscription.updated,');
    console.log('           customer.subscription.deleted, invoice.payment_failed');
    console.log('='.repeat(60));

    return {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId: yearlyPrice.id
    };

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error.message);
    process.exit(1);
  }
}

setupStripe();
