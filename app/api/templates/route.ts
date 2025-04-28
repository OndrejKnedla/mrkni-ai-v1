import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server" // Changed import

export async function GET(request: Request) {
  try {
    const supabase = createServerActionClient() // Changed function call

    const { data, error } = await supabase
      .from("prompt_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = createServerActionClient() // Changed function call
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.template) {
      return NextResponse.json({ error: "Name and template are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("prompt_templates")
      .insert({
        name: body.name,
        template: body.template,
        category: body.category || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
