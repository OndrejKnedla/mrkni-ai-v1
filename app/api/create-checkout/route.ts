import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"
import { createClient } from '@supabase/supabase-js'

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.")
}

export async function POST(request: Request) {
  try {
    // 1. Check authentication using the standard server client
    const supabaseUserClient = createServerActionClient()
    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Create Service Role Client to bypass RLS for subscription operations
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error: Supabase URL or Service Key missing.")
    }

    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { tier } = await request.json()

    if (!tier || !["basic", "premium"].includes(tier)) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: subError } = await supabaseServiceClient
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (subError && subError.code !== "PGRST116") {
      console.error("Error checking existing subscription:", subError)
      return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 })
    }

    // Prevent downgrading
    if (existingSubscription) {
      const tierLevels: Record<string, number> = { free: 0, basic: 1, premium: 2 }
      const currentTierLevel = tierLevels[existingSubscription.tier] || 0
      const newTierLevel = tierLevels[tier] || 0

      if (newTierLevel <= currentTierLevel) {
        return NextResponse.json({
          error: "Cannot downgrade or switch to the same tier. Please cancel your current subscription first."
        }, { status: 400 })
      }
    }

    // In a real implementation, you would integrate with a payment provider like Stripe
    // For this example, we'll simulate creating a subscription directly

    // Calculate subscription period
    const currentDate = new Date()
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(currentDate.getMonth() + 1)

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseServiceClient
        .from("subscriptions")
        .update({
          tier,
          updated_at: currentDate.toISOString(),
          current_period_end: nextMonth.toISOString(),
        })
        .eq("id", existingSubscription.id)

      if (updateError) {
        console.error("Error updating subscription:", updateError)
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseServiceClient
        .from("subscriptions")
        .insert({
          user_id: user.id,
          tier,
          status: "active",
          current_period_start: currentDate.toISOString(),
          current_period_end: nextMonth.toISOString(),
        })

      if (insertError) {
        console.error("Error creating subscription:", insertError)
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
      }
    }

    // In a real implementation, this would redirect to a payment page
    // For this example, we'll just return success
    return NextResponse.json({ success: true, message: "Subscription updated successfully" })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
