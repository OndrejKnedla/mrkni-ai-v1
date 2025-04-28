import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
// Import your Supabase client configured for server-side actions/updates
// Adjust the import path and client creation function as needed
// import { createAdminClient } from '@/lib/supabase/admin'; // Example: if you have an admin client
import { createServerActionClient } from '@/lib/supabase/server'; // Or use the standard server client if sufficient

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  // Use request.arrayBuffer() and convert to Buffer for Stripe verification
  const body = await request.arrayBuffer();
  const buf = Buffer.from(body);

  // Get signature from headers directly (await needed here)
  const headerPayload = await headers();
  const sig = headerPayload.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
        console.error('Webhook secret or signature missing.');
        return new NextResponse(JSON.stringify({ error: 'Webhook secret or signature missing.' }), { status: 400 });
    }
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`🔔 Checkout Session Completed: ${session.id}`);

      // --- TODO: Update your database based on the successful checkout ---
      // 1. Retrieve user identifier:
      //    - If you passed `client_reference_id` during session creation: session.client_reference_id
      //    - If you stored `userId` in subscription metadata: session.subscription ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata.userId : null
      //    - If you stored `userId` in payment intent metadata (for one-time payments): session.payment_intent ? (await stripe.paymentIntents.retrieve(session.payment_intent as string)).metadata.userId : null
      // --- Update your database based on the successful checkout ---
      const userId = session.client_reference_id; // We are sending this from the checkout session
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId) {
          console.error('Webhook Error: Missing userId (client_reference_id) in checkout session.', session);
          // Don't return error to Stripe, just log it, as Stripe expects a 200
          // return new NextResponse(JSON.stringify({ error: 'Missing client_reference_id.' }), { status: 400 });
          break; // Exit processing for this event
      }
      if (!stripeSubscriptionId) {
          console.error('Webhook Error: Missing subscription ID in checkout session.', session);
          break; // Exit processing for this event
      }
       if (!stripeCustomerId) {
          console.error('Webhook Error: Missing customer ID in checkout session.', session);
          break; // Exit processing for this event
      }

      try {
        // Fetch the subscription details from Stripe to get the plan and end date
        // Explicitly cast the result to ensure correct type
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as Stripe.Subscription;
        // Use bracket notation and ts-ignore as workarounds for persistent type issue
        // @ts-ignore - Bypassing type check for current_period_end
        const currentPeriodEnd = new Date(subscription['current_period_end'] * 1000); // Convert Unix timestamp to Date

        // Determine the plan tier based on the Price ID
        // Assumes only one item in the subscription
        // Use bracket notation here as well
        const priceId = subscription['items']?.data[0]?.price.id;
        let tier: string | null = null;
        let imageCreditsToAdd = 0;
        let videoCreditsToAdd = 0;

        // Use the Test Mode Price IDs you created
        const basicPriceId = 'price_1RDqFlRqLoid5jEQzUlyWITJ';
        const premiumPriceId = 'price_1RDqFlRqLoid5jEQlynXnhew';

        if (priceId === basicPriceId) {
          tier = 'basic';
          imageCreditsToAdd = 50;
          videoCreditsToAdd = 5;
        } else if (priceId === premiumPriceId) {
          tier = 'premium';
          imageCreditsToAdd = 1000;
          videoCreditsToAdd = 20;
        } else {
          console.error(`Webhook Error: Unknown Price ID ${priceId} in subscription ${stripeSubscriptionId}`);
          break; // Unknown plan, stop processing
        }

        // Prepare data for Supabase update
        const subscriptionUpdateData = {
          status: 'active', // Assuming 'active' is your status value
          tier: tier,
          current_period_end: currentPeriodEnd.toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: new Date().toISOString(), // Update timestamp
        };

        const creditsUpdateData = {
          image_credits: imageCreditsToAdd,
          video_credits: videoCreditsToAdd,
          updated_at: new Date().toISOString(), // Update timestamp
        };

        // Update Supabase
        const supabase = createServerActionClient();

        // 1. Update subscriptions table
        console.log(`Updating subscriptions table for user ${userId}:`, subscriptionUpdateData);
        const { error: subError } = await supabase
          .from('subscriptions')
          .update(subscriptionUpdateData)
          .eq('user_id', userId);

        if (subError) {
          throw new Error(`Supabase subscriptions update error: ${subError.message}`);
        }
        console.log(`✅ Subscriptions table updated for user ${userId}`);

        // 2. Update credits table
        console.log(`Updating credits table for user ${userId}:`, creditsUpdateData);
        const { error: credError } = await supabase
          .from('credits')
          .update(creditsUpdateData)
          .eq('user_id', userId);

        // Handle case where user might not have a credits row yet
        if (credError && credError.code === 'PGRST116') { // Check for specific Supabase error code
          console.log(`No existing credits row for user ${userId}, inserting...`);
          const { error: insertError } = await supabase
            .from('credits')
            .insert({ user_id: userId, ...creditsUpdateData });
          if (insertError) {
            throw new Error(`Supabase credits insert error: ${insertError.message}`);
          }
          console.log(`✅ Credits table inserted for user ${userId}`);
        } else if (credError) {
          throw new Error(`Supabase credits update error: ${credError.message}`);
        }
        console.log(`✅ Credits table updated for user ${userId}`);

        console.log(`✅ Successfully processed checkout.session.completed for session: ${session.id}, user: ${userId}`);

      } catch (updateError) {
          console.error('Webhook database update error:', updateError);
          // Even if DB update fails, return 200 to Stripe to prevent retries for this specific error
          // Log the error thoroughly for manual investigation.
          // Consider adding more robust error handling/retry logic if needed.
      }

      break;
    // --- TODO: Handle other event types if needed ---
    // case 'customer.subscription.deleted':
    //   const subscription = event.data.object as Stripe.Subscription;
    //   // Handle subscription cancellation: update status in your DB
    //   console.log(`Subscription deleted: ${subscription.id}`);
    //   break;
    // case 'customer.subscription.updated':
    //   const updatedSubscription = event.data.object as Stripe.Subscription;
    //   // Handle changes in subscription (e.g., plan change, status change)
    //   console.log(`Subscription updated: ${updatedSubscription.id}`);
    //   break;
    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
