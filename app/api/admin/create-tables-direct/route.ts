import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim())

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.")
}

export async function POST(request: Request) {
  try {
    // 1. Check authentication using the standard server client
    const cookieStore = cookies()
    const supabaseClient = createClient(
      supabaseUrl || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check if the user is an admin
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // 3. Create a Supabase client with the service role key
    const supabaseServiceClient = createClient(supabaseUrl || '', supabaseServiceKey || '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 4. Create the tables using direct SQL through the REST API
    try {
      console.log("Creating subscription and credits tables directly...")
      
      // Create subscriptions table
      const createSubscriptionsTable = await supabaseServiceClient.from('subscriptions').select('count').limit(1)
      
      if (createSubscriptionsTable.error && createSubscriptionsTable.error.code === '42P01') {
        console.log("Creating subscriptions table...")
        
        // Use the Supabase REST API to create the table
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey || '',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS public.subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
                status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
                current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
                current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
              );
              
              CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
              CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
              
              ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY "Users can view their own subscriptions" 
                ON public.subscriptions FOR SELECT 
                USING (auth.uid() = user_id);
              
              CREATE POLICY "Service role can manage all subscriptions" 
                ON public.subscriptions FOR ALL 
                USING (auth.jwt() ->> 'role' = 'service_role');
            `
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error creating subscriptions table:', errorData)
          return NextResponse.json({ 
            error: "Failed to create subscriptions table", 
            details: errorData 
          }, { status: 500 })
        }
        
        console.log('Successfully created subscriptions table')
      } else {
        console.log('Subscriptions table already exists')
      }
      
      // Create credits table
      const createCreditsTable = await supabaseServiceClient.from('credits').select('count').limit(1)
      
      if (createCreditsTable.error && createCreditsTable.error.code === '42P01') {
        console.log("Creating credits table...")
        
        // Use the Supabase REST API to create the table
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey || '',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS public.credits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                image_credits INTEGER NOT NULL DEFAULT 5,
                video_credits INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                CONSTRAINT unique_user_credits UNIQUE (user_id)
              );
              
              CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
              
              ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY "Users can view their own credits" 
                ON public.credits FOR SELECT 
                USING (auth.uid() = user_id);
              
              CREATE POLICY "Service role can manage all credits" 
                ON public.credits FOR ALL 
                USING (auth.jwt() ->> 'role' = 'service_role');
            `
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error creating credits table:', errorData)
          return NextResponse.json({ 
            error: "Failed to create credits table", 
            details: errorData 
          }, { status: 500 })
        }
        
        console.log('Successfully created credits table')
      } else {
        console.log('Credits table already exists')
      }
      
      console.log('Successfully created all required tables')
      return NextResponse.json({ message: "Database tables created successfully" })
    } catch (error) {
      console.error('Error creating tables:', error)
      return NextResponse.json({ 
        error: "Failed to create database tables", 
        details: error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Unhandled error in create-tables-direct endpoint:", error)
    return NextResponse.json({ 
      error: "Unhandled error in create-tables-direct endpoint", 
      details: error 
    }, { status: 500 })
  }
}
