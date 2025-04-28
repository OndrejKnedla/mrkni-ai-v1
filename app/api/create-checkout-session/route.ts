import { NextResponse } from 'next/server';
import { createServerActionClient } from '@/lib/supabase/server'; // Use the correct client for Route Handlers
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { // Reverted to using process.env
  apiVersion: '2025-03-31.basil', // Use the version expected by the installed library
  typescript: true,
});

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerActionClient(); // Use the correct client function

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('User not authenticated');
      return new NextResponse(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the price ID from the request body
    const { priceId } = await request.json();

    if (!priceId) {
      console.error('Price ID is required');
      return new NextResponse(JSON.stringify({ error: 'Price ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Define the URLs Stripe will redirect to on success or cancellation
    // Ensure these URLs exist in your application
    const successUrl = `${request.headers.get('origin')}/subscription?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${request.headers.get('origin')}/subscription`;

    // --- Optional: Check/Create Stripe Customer ---
    // For better management, associate the checkout with a Stripe Customer object.
    // Check if the user already has a stripe_customer_id in your database.
    // If not, create a new Stripe customer:
    // const customer = await stripe.customers.create({ email: user.email });
    // const stripeCustomerId = customer.id;
    // Store stripeCustomerId in your user profile table in Supabase.
    // If yes, retrieve the existing stripeCustomerId.
    // Add `customer: stripeCustomerId` to the sessionCreateParams below.
    // --- End Optional ---

    // Create the Stripe Checkout session
    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'subscription', // Important for recurring payments
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // customer: stripeCustomerId, // Uncomment if implementing the optional customer check
      client_reference_id: user.id, // Associate session with your internal user ID
      // subscription_data: { // Optional: Add metadata to the subscription
      //   metadata: {
      //     // You could store the tier here if needed in the webhook, though fetching the subscription is often better
      //     // planTier: priceId === stripePriceIds.basic ? 'basic' : 'premium',
      //   }
      // }
    };

    // Explicitly pass the key again as a potential workaround for mode mismatch issues
    const session = await stripe.checkout.sessions.create(sessionCreateParams, {
        apiKey: process.env.STRIPE_SECRET_KEY!, // Reverted to using process.env
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session.');
    }

    // Return the session ID
    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
