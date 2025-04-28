import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"

// Get admin emails from environment variable
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(email => email.trim())

export async function GET(request: Request) {
  try {
    // Check authentication
    const supabase = createServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user is an admin
    const isAdmin = ADMIN_EMAILS.includes(user.email || "")

    return NextResponse.json({ 
      isAdmin,
      adminEmails: isAdmin ? ADMIN_EMAILS : [] // Only return admin emails to admins
    })
  } catch (error) {
    console.error("Error checking admin access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
