"use client"

import { useState } from "react"
// Removed Metadata type import
import { loadStripe } from '@stripe/stripe-js';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useSubscription, type SubscriptionPlan } from "@/context/subscription-context"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui-overrides"

// Load Stripe outside of component render to avoid recreating object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Map your internal plan tiers/IDs to Stripe Price IDs
const stripePriceIds: Record<string, string> = {
  basic: 'price_1RDqFlRqLoid5jEQzUlyWITJ', // Test mode price ID
  premium: 'price_1RDqFlRqLoid5jEQlynXnhew', // Test mode price ID
  // Add other plans if necessary
};

// Removed metadata export as it's not allowed in Client Components
// export const metadata: Metadata = { ... }

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const { subscription, plans, subscribe, cancelSubscription, loading: subscriptionLoading } = useSubscription()
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null) // Keep for loading state
  const [isCanceling, setIsCanceling] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null); // For displaying Stripe errors

  // New function to handle Stripe Checkout
  const handleCheckout = async (planTier: string) => {
    setCheckoutError(null); // Clear previous errors
    const priceId = stripePriceIds[planTier];
    if (!priceId) {
      console.error(`Stripe Price ID not found for tier: ${planTier}`);
      setCheckoutError(`Configuration error: Price ID for ${planTier} plan not found.`);
      return;
    }

    setProcessingPlanId(planTier); // Use planTier or priceId for processing state

    try {
      // 1. Call your backend to create the checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }), // Send the Stripe Price ID
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        throw new Error('Failed to retrieve session ID from backend.');
      }

      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      // If `redirectToCheckout` fails due to browser issues or network errors,
      // display the error message.
      if (error) {
        console.error("Stripe redirect error:", error);
        setCheckoutError(error.message ?? "An unexpected error occurred during checkout redirection.");
      }
      // No need to reset processingPlanId here, as the user is redirected

    } catch (error) {
      console.error("Checkout failed:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during checkout.";
      setCheckoutError(message);
      setProcessingPlanId(null); // Reset loading state on error
    }
  };


  const handleCancelSubscription = async () => {
    if (!subscription?.active || subscription?.tier === "free") return

    if (confirm("Are you sure you want to cancel your subscription? You will lose access to premium features.")) {
      setIsCanceling(true)
      try {
        await cancelSubscription()
      } finally {
        setIsCanceling(false)
      }
    }
  }

  if (authLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-white drop-shadow-md">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[60vh] justify-center">
        <GlassCard className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Authentication Required</CardTitle>
            <CardDescription className="text-white/70">Please sign in to view subscription options</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/">
              <Button>Go to Sign In</Button>
            </Link>
          </CardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">Choose Your Plan</h1>
        <p className="text-white/70 mt-2 max-w-2xl mx-auto">
          Unlock the full potential of MrkniAI with our subscription plans. Generate stunning images and videos with our
          advanced AI models.
        </p>
      </div>

      {/* Display Checkout Error */}
      {checkoutError && (
        <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded max-w-md mx-auto text-center">
          <p><strong>Checkout Error:</strong> {checkoutError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id} // Assuming plan.id is unique
            plan={plan}
            currentTier={subscription?.tier || "free"}
            onCheckout={handleCheckout} // Pass the new checkout handler
            processing={processingPlanId === plan.tier} // Match processing state by tier
          />
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-white drop-shadow-md mb-6">Current Subscription</h2>
        <GlassCard className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-white">
              {plans.find((p) => p.tier === subscription?.tier)?.name || "Free"} Plan
            </CardTitle>
            <CardDescription className="text-white/70">
              {subscription?.active ? "Active" : "Inactive"}
              {subscription?.expiresAt && ` • Expires ${new Date(subscription.expiresAt).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white">Image Credits:</span>
                <span className="text-white font-medium">{subscription?.imageCredits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Video Credits:</span>
                <span className="text-white font-medium">{subscription?.videoCredits || 0}</span>
              </div>
            </div>
          </CardContent>
          {subscription?.tier !== "free" && subscription?.active && (
            <CardFooter>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </CardFooter>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  currentTier,
  onCheckout, // Changed from onSubscribe
  processing,
}: {
  plan: SubscriptionPlan
  currentTier: string
  onCheckout: (planTier: string) => Promise<void> // Expecting planTier now
  processing: boolean
}) {
  const isCurrentPlan = plan.tier === currentTier
  const isFreePlan = plan.tier === "free";

  // Determine if this plan is a downgrade or the same tier
  const tierLevels: Record<string, number> = { free: 0, basic: 1, premium: 2 }
  const currentTierLevel = tierLevels[currentTier] || 0
  const planTierLevel = tierLevels[plan.tier] || 0
  const isDowngradeOrSame = planTierLevel <= currentTierLevel

  // Determine button text based on plan comparison
  const getButtonText = () => {
    if (processing) return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Processing...
      </>
    )
    if (isCurrentPlan) return "Current Plan"
    if (isFreePlan) return "Free Plan" // Or maybe hide button for free plan?
    if (isDowngradeOrSame && !isFreePlan) return "Cannot Downgrade" // Prevent downgrade for paid plans
    return "Subscribe" // Changed from "Upgrade" for clarity
  }

  const handleButtonClick = () => {
    if (!isFreePlan && !isCurrentPlan && !isDowngradeOrSame) {
      onCheckout(plan.tier); // Call onCheckout with the plan's tier
    }
    // Potentially handle free plan selection differently if needed
    // else if (isFreePlan) { /* handle free plan selection if necessary */ }
  };

  return (
    // Add flex flex-col to make the card a column flex container
    <GlassCard className={`relative flex flex-col ${plan.tier === "premium" ? "border-primary/50 shadow-lg shadow-primary/20" : ""}`}>
      {plan.tier === "premium" && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-white">{plan.name}</CardTitle>
        <CardDescription className="text-white/70">{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-3xl font-bold text-white">${plan.price}</span>
          <span className="text-white/70 ml-1">/month</span>
        </div>
      </CardHeader>
      {/* Add flex-grow to make content take available space */}
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span className="text-white/90">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${isCurrentPlan || (isDowngradeOrSame && !isFreePlan) ? "bg-gray-500 hover:bg-gray-600" : ""}`}
          // Disable for current plan, processing, downgrades (except to free), or if it's the free plan itself (unless you want an action)
          disabled={isCurrentPlan || processing || (isDowngradeOrSame && !isFreePlan) || isFreePlan}
          onClick={handleButtonClick} // Use the new handler
        >
          {getButtonText()}
        </Button>
      </CardFooter>
    </GlassCard>
  )
}
