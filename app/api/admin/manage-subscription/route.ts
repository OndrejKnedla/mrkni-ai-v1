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

// Helper function to check if tables exist and create them if needed
async function checkAndCreateTables(supabaseClient: any) {
  try {
    // Check if the subscriptions table exists
    const { error } = await supabaseClient
      .from('subscriptions')
      .select('count')
      .limit(1)

    if (error) {
      // If the table doesn't exist, create it
      if (error.code === '42P01' && error.message.includes('does not exist')) {
        console.log("Subscriptions table doesn't exist. Creating tables...")
        await createSubscriptionTables(supabaseClient)
      } else {
        console.error("Error checking if tables exist:", error)
        throw error
      }
    } else {
      console.log("Subscription tables already exist")
    }
  } catch (error) {
    console.error("Exception checking tables:", error)
    throw error
  }
}

// Helper function to create subscription tables if they don't exist
async function createSubscriptionTables(supabaseClient: any) {
  try {
    console.log("Creating subscription and credits tables...")

    // SQL to create the tables
    const createTablesSql = `
      -- Create subscriptions table
      CREATE TABLE IF NOT EXISTS public.subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
          status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
          current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
          current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );

      -- Create credits table
      CREATE TABLE IF NOT EXISTS public.credits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          image_credits INTEGER NOT NULL DEFAULT 5,
          video_credits INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          CONSTRAINT unique_user_credits UNIQUE (user_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);

      -- Add RLS policies
      ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

      -- Create policies for subscriptions
      CREATE POLICY "Users can view their own subscriptions"
          ON public.subscriptions FOR SELECT
          USING (auth.uid() = user_id);

      CREATE POLICY "Service role can manage all subscriptions"
          ON public.subscriptions FOR ALL
          USING (auth.jwt() ->> 'role' = 'service_role');

      -- Create policies for credits
      CREATE POLICY "Users can view their own credits"
          ON public.credits FOR SELECT
          USING (auth.uid() = user_id);

      CREATE POLICY "Service role can manage all credits"
          ON public.credits FOR ALL
          USING (auth.jwt() ->> 'role' = 'service_role');
    `

    // Execute the SQL directly using the Supabase client
    // We'll split the SQL into individual statements and execute them one by one
    const statements = createTablesSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    for (const statement of statements) {
      console.log(`Executing SQL statement: ${statement.substring(0, 50)}...`)

      try {
        // Use the rpc function to execute SQL directly
        const { error } = await supabaseClient.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          // If the exec_sql function doesn't exist, we need to create it first
          if (error.message.includes('function exec_sql') && error.message.includes('does not exist')) {
            console.log('Creating exec_sql function...')

            // Create the exec_sql function using direct REST API call
            const createFunctionSql = `
              CREATE OR REPLACE FUNCTION exec_sql(sql text)
              RETURNS JSONB
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              DECLARE
                result JSONB;
              BEGIN
                EXECUTE sql;
                RETURN '{}'::JSONB;
              EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object('error', SQLERRM);
              END;
              $$;
            `

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
                query: createFunctionSql
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              console.error('Error creating exec_sql function:', errorData)
              throw new Error(`Failed to create exec_sql function: ${JSON.stringify(errorData)}`)
            }

            console.log('Successfully created exec_sql function')

            // Now try to execute the original statement again
            const { error: retryError } = await supabaseClient.rpc('exec_sql', {
              sql: statement
            })

            if (retryError) {
              console.error(`Error executing SQL statement after creating function: ${retryError.message}`)
              throw new Error(`Failed to execute SQL: ${retryError.message}`)
            }
          } else {
            console.error(`Error executing SQL statement: ${error.message}`)
            throw new Error(`Failed to execute SQL: ${error.message}`)
          }
        }
      } catch (stmtError) {
        console.error(`Exception executing SQL statement: ${stmtError}`)
        throw stmtError
      }
    }

    console.log('Successfully created subscription and credits tables')
    return true
  } catch (error) {
    console.error('Error creating subscription tables:', error)
    throw error
  }
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

    // Log that we're using the service client for debugging
    console.log("Using Supabase service client for admin operations")

    // We'll handle table existence checks in the specific operations

    const { targetUserId, tier, action } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 })
    }

    if (action === "delete") {
      // First, verify that the target user exists
      try {
        // Check if the user exists by querying the auth admin API
        console.log("Verifying user exists for deletion with ID:", targetUserId)

        const { data, error } = await supabaseServiceClient
          .auth
          .admin
          .getUserById(targetUserId)

        if (error) {
          console.error("Error finding user for deletion:", error)
          return NextResponse.json({ error: "User not found", details: error }, { status: 404 })
        }

        if (!data.user) {
          console.error("User not found with ID for deletion:", targetUserId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("Verified user exists for subscription deletion:", targetUserId, data.user)
      } catch (error) {
        console.error("Exception verifying user for deletion:", error)
        return NextResponse.json({ error: "Failed to verify user for deletion", details: error }, { status: 500 })
      }

      try {
        // Cancel all active subscriptions for the user
        console.log("Canceling active subscriptions for user:", targetUserId)
        const { error: updateError } = await supabaseServiceClient
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", targetUserId)
          .eq("status", "active")

        if (updateError) {
          console.error("Error canceling subscription:", updateError)
          return NextResponse.json({ error: "Failed to cancel subscription", details: updateError }, { status: 500 })
        }
      } catch (error) {
        console.error("Exception canceling subscription:", error)
        return NextResponse.json({ error: "Exception canceling subscription", details: error }, { status: 500 })
      }

      try {
        // Check if the user has a credits entry
        try {
          const { data: existingCredits, error } = await supabaseServiceClient
            .from("credits")
            .select("id")
            .eq("user_id", targetUserId)
            .maybeSingle()

          if (error) {
            // Check if the error is because the table doesn't exist
            if (error.code === '42P01' && error.message.includes('does not exist')) {
              console.log("Credits table doesn't exist yet for reset. Skipping reset.")
              // Return success since there's nothing to reset
              return NextResponse.json({ message: "Subscription canceled successfully. No credits to reset." })
            } else {
              console.error("Error checking credits for reset:", error)
              return NextResponse.json({ error: "Failed to check credits for reset", details: error }, { status: 500 })
            }
          }

          console.log("Existing credits check result for reset:", { existingCredits })

          if (existingCredits) {
            // Reset user to free tier
            console.log("Resetting credits to free tier for user:", targetUserId)
            const { error: creditsError } = await supabaseServiceClient
              .from("credits")
              .update({
                image_credits: 5,
                video_credits: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", targetUserId)

            if (creditsError) {
              console.error("Error updating credits for reset:", creditsError)
              return NextResponse.json({ error: "Failed to reset credits", details: creditsError }, { status: 500 })
            }
          } else {
            console.log("No credits entry found for user, skipping reset:", targetUserId)
          }
        } catch (checkError) {
          console.error("Error checking credits for reset:", checkError)
          return NextResponse.json({ error: "Failed to check credits for reset", details: checkError }, { status: 500 })
        }
      } catch (error) {
        console.error("Exception resetting credits:", error)
        return NextResponse.json({ error: "Exception resetting credits", details: error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Subscription canceled and credits reset to free tier"
      })
    } else if (action === "add") {
      if (!tier || !["basic", "premium"].includes(tier)) {
        return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
      }

      // First, verify that the target user exists
      try {
        // Check if the user exists by querying the auth admin API
        console.log("Verifying user exists with ID:", targetUserId)

        const { data, error } = await supabaseServiceClient
          .auth
          .admin
          .getUserById(targetUserId)

        if (error) {
          console.error("Error finding user:", error)
          return NextResponse.json({ error: "User not found", details: error }, { status: 404 })
        }

        if (!data.user) {
          console.error("User not found with ID:", targetUserId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("Verified user exists for subscription addition:", targetUserId, data.user)
      } catch (error) {
        console.error("Exception verifying user:", error)
        return NextResponse.json({ error: "Failed to verify user", details: error }, { status: 500 })
      }

      // Check if user already has an active subscription
      let existingSubscription = null;
      try {
        const { data, error } = await supabaseServiceClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("status", "active")
          .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record exists

        if (error) {
          // Check if the error is because the table doesn't exist
          if (error.code === '42P01' && error.message.includes('does not exist')) {
            console.log("Subscriptions table doesn't exist yet.")
            return NextResponse.json({
              error: "Database tables don't exist yet",
              details: { message: "Tables don't exist", code: "TABLES_MISSING" }
            }, { status: 400 })
          } else {
            console.error("Error checking existing subscription:", error)
            return NextResponse.json({ error: "Failed to check subscription status", details: error }, { status: 500 })
          }
        }

        existingSubscription = data;
        console.log("Existing subscription check result:", { existingSubscription })
      } catch (error) {
        console.error("Exception checking subscription:", error)
        return NextResponse.json({ error: "Exception checking subscription status", details: error }, { status: 500 })
      }

      try {
        // Calculate subscription period
        const currentDate = new Date()
        const nextMonth = new Date(currentDate)
        nextMonth.setMonth(currentDate.getMonth() + 1)

        if (existingSubscription) {
          // Update existing subscription
          console.log("Updating existing subscription for user:", targetUserId, "to tier:", tier)
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
            return NextResponse.json({ error: "Failed to update subscription", details: updateError }, { status: 500 })
          }
        } else {
          // Create new subscription
          console.log("Creating new subscription for user:", targetUserId, "with tier:", tier)
          const { error: insertError } = await supabaseServiceClient
            .from("subscriptions")
            .insert({
              user_id: targetUserId,
              tier,
              status: "active",
              current_period_start: currentDate.toISOString(),
              current_period_end: nextMonth.toISOString(),
            })

          if (insertError) {
            console.error("Error creating subscription:", insertError)
            return NextResponse.json({ error: "Failed to create subscription", details: insertError }, { status: 500 })
          }
        }
      } catch (error) {
        console.error("Exception managing subscription:", error)
        return NextResponse.json({ error: "Exception managing subscription", details: error }, { status: 500 })
      }

      // Credits will be set based on tier in the code below

      // First check if the user has a credits entry
      let existingCredits = null;
      try {
        const { data, error } = await supabaseServiceClient
          .from("credits")
          .select("id")
          .eq("user_id", targetUserId)
          .maybeSingle() // Use maybeSingle instead of single

        if (error) {
          // Check if the error is because the table doesn't exist
          if (error.code === '42P01' && error.message.includes('does not exist')) {
            console.log("Credits table doesn't exist yet.")
            return NextResponse.json({
              error: "Database tables don't exist yet",
              details: { message: "Tables don't exist", code: "TABLES_MISSING" }
            }, { status: 400 })
          } else {
            console.error("Error checking credits:", error)
            return NextResponse.json({ error: "Failed to check credits", details: error }, { status: 500 })
          }
        }

        existingCredits = data;
        console.log("Existing credits check result:", { existingCredits })
      } catch (error) {
        console.error("Exception checking credits:", error)
        return NextResponse.json({ error: "Exception checking credits", details: error }, { status: 500 })
      }

      try {
        // Set appropriate credits based on tier
        const imageCredits = tier === "premium" ? 1000 : 50
        const videoCredits = tier === "premium" ? 20 : 5

        if (!existingCredits) {
          // Create new credits entry if it doesn't exist
          console.log("Creating new credits entry for user:", targetUserId)
          const { error: insertError } = await supabaseServiceClient
            .from("credits")
            .insert({
              user_id: targetUserId,
              image_credits: imageCredits,
              video_credits: videoCredits,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error("Error inserting credits:", insertError)
            return NextResponse.json({ error: "Failed to create credits entry", details: insertError }, { status: 500 })
          }
        } else {
          // Update existing credits
          console.log("Updating existing credits for user:", targetUserId)
          const { error: updateError } = await supabaseServiceClient
            .from("credits")
            .update({
              image_credits: imageCredits,
              video_credits: videoCredits,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", targetUserId)

          if (updateError) {
            console.error("Error updating credits:", updateError)
            return NextResponse.json({ error: "Failed to update credits", details: updateError }, { status: 500 })
          }
        }
      } catch (error) {
        console.error("Exception managing credits:", error)
        return NextResponse.json({ error: "Exception managing credits", details: error }, { status: 500 })
      }

      // Credits have been successfully updated at this point

      return NextResponse.json({
        success: true,
        message: `Subscription updated to ${tier} tier successfully`
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error managing subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
