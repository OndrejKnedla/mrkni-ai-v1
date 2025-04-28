import { NextResponse } from "next/server"
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
    // Create Service Role Client to bypass RLS
    const supabaseServiceClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create the interested_users table
    const createInterestedUsersTable = `
      CREATE TABLE IF NOT EXISTS public.interested_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        notified BOOLEAN NOT NULL DEFAULT FALSE
      );
      
      -- Create RLS policies for interested_users
      ALTER TABLE public.interested_users ENABLE ROW LEVEL SECURITY;
      
      -- Only service role can read all interested users
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'interested_users' 
          AND policyname = 'Service role can read all interested users'
        ) THEN
          CREATE POLICY "Service role can read all interested users"
            ON public.interested_users
            FOR SELECT
            USING (auth.jwt() ->> 'role' = 'service_role');
        END IF;
      END
      $$;
      
      -- Only service role can insert/update/delete interested users
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'interested_users' 
          AND policyname = 'Service role can manage interested users'
        ) THEN
          CREATE POLICY "Service role can manage interested users"
            ON public.interested_users
            USING (auth.jwt() ->> 'role' = 'service_role');
        END IF;
      END
      $$;
    `

    // Execute the SQL directly
    const { error: createError } = await supabaseServiceClient.rpc('exec_sql', {
      sql: createInterestedUsersTable
    })

    if (createError) {
      console.error("Error creating table:", createError)
      return NextResponse.json({ error: "Failed to create database table" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Interested users table created successfully" 
    })
  } catch (error) {
    console.error("Error in create-interested-users-table API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
