// Create Stripe products and prices in test mode
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
});

async function createProductsAndPrices() {
  try {
    console.log('Creating Stripe products and prices in test mode...');

    // Create Basic Plan product
    const basicProduct = await stripe.products.create({
      name: 'Basic Plan',
      description: 'More generations with higher quality',
    });
    console.log('Created Basic Plan product:', basicProduct.id);

    // Create Basic Plan price
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('Created Basic Plan price:', basicPrice.id);

    // Create Premium Plan product
    const premiumProduct = await stripe.products.create({
      name: 'Premium Plan',
      description: 'Unlimited generations with highest quality',
    });
    console.log('Created Premium Plan product:', premiumProduct.id);

    // Create Premium Plan price
    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 2999, // $29.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('Created Premium Plan price:', premiumPrice.id);

    console.log('\n✅ Successfully created Stripe products and prices!');
    console.log('\nUpdate these price IDs in your code:');
    console.log(`Basic Plan: ${basicPrice.id}`);
    console.log(`Premium Plan: ${premiumPrice.id}`);
  } catch (error) {
    console.error('Error creating Stripe products and prices:', error);
  }
}

createProductsAndPrices();
