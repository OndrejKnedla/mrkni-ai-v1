import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name } = body // Added name back

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Create a service role client with admin privileges
    const supabaseServiceClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // We'll assume the table exists since we've created it in the Supabase dashboard
    // If you need to create the table, do it through the Supabase dashboard
    // or use a migration script

    // Insert the user's email into the database
    const { data, error } = await supabaseServiceClient
      .from('interested_users')
      .upsert({
        email,
        name: name || null, // Added name field back
        created_at: new Date().toISOString(),
        notified: false
      })
      .select()

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: "You're already registered! We'll notify you when we launch."
        })
      }

      console.error("Error registering interest:", error)
      return NextResponse.json({ error: "Failed to register interest" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your interest! We'll notify you when we launch."
    })
  } catch (error) {
    console.error("Error in register-interest API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
