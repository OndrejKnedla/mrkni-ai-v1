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

// No helper functions needed - we'll use the existing Supabase API

export async function GET(request: Request) {
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

    // 3. Create Service Role Client to bypass RLS for user operations
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error: Supabase URL or Service Key missing.")
    }

    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Log that we're using the service client for debugging
    console.log("Using Supabase service client for admin operations")

    // Check if the subscription tables exist
    try {
      const { error } = await supabaseServiceClient
        .from('subscriptions')
        .select('count')
        .limit(1)

      if (error) {
        // If the table doesn't exist, log it but continue
        if (error.code === '42P01' && error.message.includes('does not exist')) {
          console.log("Subscriptions table doesn't exist yet. Users will be listed without subscription info.")
        } else {
          console.error("Error checking if subscription tables exist:", error)
        }
      } else {
        console.log("Subscription tables exist")
      }
    } catch (error) {
      console.error("Exception checking subscription tables:", error)
      // Continue anyway
    }

    // 4. Fetch users using the auth.admin.listUsers() function for service role client
    try {
      console.log("Fetching users using auth.admin.listUsers()")
      const { data, error } = await supabaseServiceClient
        .auth
        .admin
        .listUsers({
          page: 1,
          perPage: 100
        })

      if (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json({ error: "Failed to fetch users", details: error }, { status: 500 })
      }

      console.log(`Successfully fetched ${data?.users?.length || 0} users`)

      // Get the list of users
      const users = data.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }));

      // Try to fetch subscription information if the table exists
      try {
        const { data: subscriptions, error: subscriptionsError } = await supabaseServiceClient
          .from("subscriptions")
          .select("user_id, tier, status")
          .eq("status", "active")

        if (subscriptionsError) {
          if (subscriptionsError.code === '42P01') {
            console.log("Subscriptions table doesn't exist yet. Users will be listed without subscription info.")
          } else {
            console.error("Error fetching subscriptions:", subscriptionsError)
          }
          // Continue without subscriptions data
        } else if (subscriptions) {
          // Combine user and subscription data
          const usersWithSubscriptions = users.map(user => {
            const subscription = subscriptions.find(sub => sub.user_id === user.id)
            return {
              ...user,
              subscription: subscription ? {
                tier: subscription.tier,
                status: subscription.status
              } : undefined
            }
          })

          return NextResponse.json({ users: usersWithSubscriptions })
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error)
        // Continue without subscription data
      }

      // Return users without subscription data if we couldn't fetch it
      return NextResponse.json({ users })
    } catch (error) {
      console.error("Exception listing users:", error)
      return NextResponse.json({ error: "Failed to list users", details: error }, { status: 500 })
    }

  } catch (error) {
    // This is the outer try/catch for the entire handler
    console.error("Unhandled error in list-users endpoint:", error)
    return NextResponse.json({ error: "Unhandled server error", details: error }, { status: 500 })
  }
}
