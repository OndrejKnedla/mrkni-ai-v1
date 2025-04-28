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

    // 3. Create Service Role Client to bypass RLS
    const supabaseServiceClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 4. Check if the table exists
    try {
      const { error: tableCheckError } = await supabaseServiceClient
        .from('interested_users')
        .select('count')
        .limit(1)

      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist yet
        return NextResponse.json({ users: [] })
      }
    } catch (error) {
      console.error("Error checking table:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // 5. Fetch all interested users
    const { data: users, error } = await supabaseServiceClient
      .from('interested_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching interested users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error in interested-users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
