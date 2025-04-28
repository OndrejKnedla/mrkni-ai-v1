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

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabaseServiceClient
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single()

    if (subError) {
      console.error("Error fetching subscription:", subError)
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Update subscription status
    const { error: updateError } = await supabaseServiceClient
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)

    if (updateError) {
      console.error("Error canceling subscription:", updateError)
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
    }

    // Create a new free tier subscription
    const currentDate = new Date()
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(currentDate.getMonth() + 1)

    const { error: insertError } = await supabaseServiceClient
      .from("subscriptions")
      .insert({
        user_id: user.id,
        tier: "free",
        status: "active",
        current_period_start: currentDate.toISOString(),
        current_period_end: nextMonth.toISOString(),
      })

    if (insertError) {
      console.error("Error creating free subscription:", insertError)
      // Don't return an error here, as the subscription was already canceled
    }

    // Reset user to free tier
    const { error: creditsError } = await supabaseServiceClient
      .from("credits")
      .update({
        image_credits: 5,
        video_credits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (creditsError) {
      console.error("Error updating credits:", creditsError)
      // Don't return an error here, as the subscription was already canceled
    }

    return NextResponse.json({ success: true, message: "Subscription canceled successfully" })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
