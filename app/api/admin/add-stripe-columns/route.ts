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

    // 3. Create Service Role Client to bypass RLS for subscription operations
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

    // SQL to add Stripe columns
    const sql = `
      -- Add Stripe columns to subscriptions table if they don't exist
      ALTER TABLE public.subscriptions 
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
    `

    // Execute the SQL using the exec_sql RPC function
    try {
      const { error } = await supabaseServiceClient.rpc('exec_sql', {
        sql: sql
      })

      if (error) {
        console.error('Error executing SQL:', error)
        return NextResponse.json({ error: "Failed to add Stripe columns", details: error }, { status: 500 })
      }
    } catch (error) {
      console.error('Exception executing SQL:', error)
      
      // Try direct SQL execution as a fallback
      try {
        // Execute the SQL directly using the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            query: sql
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error executing SQL directly:', errorData)
          return NextResponse.json({ error: "Failed to add Stripe columns", details: errorData }, { status: 500 })
        }
      } catch (directError) {
        console.error('Exception executing SQL directly:', directError)
        return NextResponse.json({ error: "Failed to add Stripe columns", details: directError }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Stripe columns added successfully"
    })
  } catch (error) {
    console.error("Error adding Stripe columns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
