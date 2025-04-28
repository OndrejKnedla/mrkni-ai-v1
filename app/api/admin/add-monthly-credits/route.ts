import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"
import { createClient } from '@supabase/supabase-js'

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(email => email.trim())

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

    // 2. Check if the user is an admin
    if (!ADMIN_EMAILS.includes(user.email || "")) {
      console.error(`Unauthorized admin access attempt by ${user.email}`)
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // 3. Create Service Role Client to bypass RLS
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error: Supabase URL or Service Key missing.")
    }

    // Create a service role client with admin privileges
    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 4. Call the add_monthly_credits function
    try {
      const { data, error } = await supabaseServiceClient.rpc('add_monthly_credits')

      if (error) {
        console.error("Error adding monthly credits:", error)
        return NextResponse.json({ error: "Failed to add monthly credits", details: error }, { status: 500 })
      }

      // 5. Get the count of users who received credits
      const { count, error: countError } = await supabaseServiceClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (countError) {
        console.error("Error counting active subscriptions:", countError)
      }

      return NextResponse.json({
        success: true,
        message: `Successfully added monthly credits to ${count || 'all'} active users based on their subscription tier`,
        usersAffected: count || 'unknown'
      })
    } catch (error) {
      console.error("Exception adding monthly credits:", error)
      return NextResponse.json({ error: "Exception adding monthly credits", details: error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in add-monthly-credits API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
