import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    // 1. Check authentication
    const supabase = createServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Create a Supabase client with the service role key
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error: Supabase URL or Service Key missing.")
    }

    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 3. Check if the user already has a credits record
    const { data: existingCredits, error: checkError } = await supabaseServiceClient
      .from("credits")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing credits:", checkError)
      return NextResponse.json({ error: "Failed to check existing credits" }, { status: 500 })
    }

    // 4. If the user doesn't have a credits record, create one
    if (!existingCredits) {
      const { error: insertError } = await supabaseServiceClient
        .from("credits")
        .insert({
          user_id: user.id,
          image_credits: 5, // Free tier: 5 image credits
          video_credits: 0, // Free tier: 0 video credits
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error("Error creating credits record:", insertError)
        return NextResponse.json({ error: "Failed to create credits record" }, { status: 500 })
      }

      console.log(`Created credits record for user ${user.id}`)
      return NextResponse.json({ message: "Credits initialized successfully", initialized: true })
    }

    // 5. If the user already has a credits record, return success
    return NextResponse.json({ message: "Credits already initialized", initialized: false })
  } catch (error) {
    console.error("Error initializing credits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
