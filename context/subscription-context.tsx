"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from "react" // Added useMemo
import { useAuth } from "./auth-context"
import { createClient } from "@/lib/supabase/client" // Import createClient function

// Map your internal plan tiers/IDs to Stripe Price IDs
const stripePriceIds: Record<string, string> = {
  basic: 'price_1RDqFlRqLoid5jEQzUlyWITJ', // Test mode price ID
  premium: 'price_1RDqFlRqLoid5jEQlynXnhew', // Test mode price ID
  // Add other plans if necessary
}

export type SubscriptionTier = "free" | "basic" | "premium"

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  tier: SubscriptionTier
  imageCredits: number
  videoCredits: number
}

export interface UserSubscription {
  tier: SubscriptionTier
  active: boolean
  expiresAt: string | null
  imageCredits: number
  videoCredits: number
}

type SubscriptionContextType = {
  subscription: UserSubscription | null
  loading: boolean
  plans: SubscriptionPlan[]
  subscribe: (planId: string) => Promise<void>
  cancelSubscription: () => Promise<void>
  refreshSubscription: () => Promise<void>
  hasCredits: (type: "image" | "video") => boolean
  useCredit: (type: "image" | "video") => Promise<boolean>
}

const defaultSubscription: UserSubscription = {
  tier: "free",
  active: true,
  expiresAt: null,
  imageCredits: 5,
  videoCredits: 0,
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic access with limited generations",
    price: 0,
    features: ["5 image generations per month", "Community support", "Standard quality"],
    tier: "free",
    imageCredits: 5,
    videoCredits: 0,
  },
  {
    id: "basic",
    name: "Basic",
    description: "More generations with higher quality",
    price: 9.99,
    features: ["50 image generations per month", "5 video generations per month", "Priority support", "High quality"],
    tier: "basic",
    imageCredits: 50,
    videoCredits: 5,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Unlimited generations with highest quality",
    price: 29.99,
    features: [
      "1000 image generations per month",
      "20 video generations per month",
      "Priority support",
      "Highest quality",
      "Early access to new features",
    ],
    tier: "premium",
    imageCredits: 1000,
    videoCredits: 20,
  },
]

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  // Get the Supabase client instance using the function
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Ensure supabase client is available before proceeding
    if (!supabase) {
      console.error("Supabase client not available in SubscriptionProvider useEffect");
      setLoading(false); // Stop loading if client fails
      return;
    }

    if (user) {
      fetchSubscription()
    } else {
      setSubscription(defaultSubscription)
      setLoading(false)
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      setLoading(true)

      if (!user) {
        setSubscription(defaultSubscription)
        return
      }

      // Fetch subscription from Supabase
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is expected for users without subscriptions
        console.error("Error fetching subscription:", subscriptionError)
        throw subscriptionError
      }

      // Fetch credits from Supabase
      let creditsData = null;
      let creditsError = null;

      try {
        const { data, error } = await supabase
          .from("credits")
          .select("*")
          .eq("user_id", user.id)
          .single()

        creditsData = data;
        creditsError = error;
      } catch (error) {
        console.error("Exception fetching credits:", error);
        creditsError = error;
      }

      // If there was an error fetching credits, try to initialize them
      if (creditsError) {
        console.error("Error fetching credits:", creditsError)

        try {
          console.log("Attempting to initialize credits...")
          const response = await fetch("/api/user/initialize-credits", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const result = await response.json()
            console.log("Credits initialization result:", result)

            // If credits were initialized, fetch them again
            if (result.initialized) {
              const { data: newCreditsData, error: newCreditsError } = await supabase
                .from("credits")
                .select("*")
                .eq("user_id", user.id)
                .single()

              if (!newCreditsError) {
                // Successfully fetched credits after initialization
                creditsData = newCreditsData;
                creditsError = null;
              }
            }
          } else {
            console.error("Failed to initialize credits:", await response.json())
          }
        } catch (initError) {
          console.error("Error initializing credits:", initError)
        }
      }

      // If we still have an error after trying to initialize credits, use default values
      if (creditsError) {
        console.warn("Using default credits after initialization attempt failed")
        creditsData = {
          image_credits: 5,
          video_credits: 0
        }
      }

      // Set subscription based on data
      if (subscriptionData) {
        // User has an active subscription
        setSubscription({
          tier: subscriptionData.tier as SubscriptionTier,
          active: true,
          expiresAt: subscriptionData.current_period_end,
          imageCredits: creditsData?.image_credits || 0,
          videoCredits: creditsData?.video_credits || 0,
        })
      } else if (creditsData) {
        // User has no subscription but has credits (free tier)
        setSubscription({
          tier: "free",
          active: true,
          expiresAt: null,
          imageCredits: creditsData.image_credits,
          videoCredits: creditsData.video_credits,
        })
      } else {
        // Fallback to default subscription
        setSubscription(defaultSubscription)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
      setSubscription(defaultSubscription)
    } finally {
      setLoading(false)
    }
  }

  const subscribe = async (planId: string) => {
    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      const plan = subscriptionPlans.find((p) => p.id === planId)
      if (!plan) {
        throw new Error("Invalid plan selected")
      }

      // Call the API to create or update subscription
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId: stripePriceIds[plan.tier] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create subscription")
      }

      // Refresh subscription data
      await fetchSubscription()
    } catch (error) {
      console.error("Error subscribing to plan:", error)
      alert(error instanceof Error ? error.message : "Failed to subscribe to plan")
    }
  }

  const cancelSubscription = async () => {
    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Fetch current subscription to get the ID
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (subscriptionError) {
        throw new Error("No active subscription found")
      }

      // Call the API to cancel subscription
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: subscriptionData.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel subscription")
      }

      // Refresh subscription data
      await fetchSubscription()
    } catch (error) {
      console.error("Error canceling subscription:", error)
      alert(error instanceof Error ? error.message : "Failed to cancel subscription")
    }
  }

  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  const hasCredits = (type: "image" | "video") => {
    if (!subscription) return false
    return type === "image" ? subscription.imageCredits > 0 : subscription.videoCredits > 0
  }

  const useCredit = async (type: "image" | "video") => {
    try {
      if (!user || !subscription) return false

      // Check if user has credits
      if ((type === "image" && subscription.imageCredits <= 0) ||
          (type === "video" && subscription.videoCredits <= 0)) {
        return false
      }

      // Call the appropriate RPC function to decrement credits
      const { data, error } = await supabase.rpc(
        type === "image" ? "decrement_image_credit" : "decrement_video_credit",
        { p_user_id: user.id }
      )

      if (error) {
        console.error(`Error using ${type} credit:`, error)
        return false
      }

      // If successful, update the local state
      if (data === true) {
        if (type === "image") {
          setSubscription({
            ...subscription,
            imageCredits: subscription.imageCredits - 1,
          })
        } else {
          setSubscription({
            ...subscription,
            videoCredits: subscription.videoCredits - 1,
          })
        }
        return true
      }

      return false
    } catch (error) {
      console.error(`Error using ${type} credit:`, error)
      return false
    }
  }

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        plans: subscriptionPlans,
        subscribe,
        cancelSubscription,
        refreshSubscription,
        hasCredits,
        useCredit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}
