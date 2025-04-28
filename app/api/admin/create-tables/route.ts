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

    // 4. Create the tables
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
      
      // Execute the SQL statements one by one
      const statements = createTablesSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
      
      for (const statement of statements) {
        console.log(`Executing SQL statement: ${statement.substring(0, 50)}...`)
        
        try {
          // Try to execute the SQL directly
          const { error } = await supabaseServiceClient.rpc('exec_sql', { 
            sql: statement 
          })
          
          if (error) {
            // If the exec_sql function doesn't exist, we need to create it first
            if (error.message.includes('function exec_sql') && error.message.includes('does not exist')) {
              console.log('Creating exec_sql function...')
              
              // Create the exec_sql function
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
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseServiceKey || '',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  sql: createFunctionSql
                })
              })
              
              if (!response.ok) {
                const errorData = await response.json()
                console.error('Error creating exec_sql function:', errorData)
                return NextResponse.json({ 
                  error: "Failed to create exec_sql function", 
                  details: errorData 
                }, { status: 500 })
              }
              
              console.log('Successfully created exec_sql function')
              
              // Now try to execute the original statement again
              const { error: retryError } = await supabaseServiceClient.rpc('exec_sql', { 
                sql: statement 
              })
              
              if (retryError) {
                console.error(`Error executing SQL statement after creating function: ${retryError.message}`)
                return NextResponse.json({ 
                  error: "Failed to execute SQL after creating function", 
                  details: retryError 
                }, { status: 500 })
              }
            } else {
              console.error(`Error executing SQL statement: ${error.message}`)
              return NextResponse.json({ 
                error: "Failed to execute SQL", 
                details: error 
              }, { status: 500 })
            }
          }
        } catch (stmtError) {
          console.error(`Exception executing SQL statement: ${stmtError}`)
          return NextResponse.json({ 
            error: "Exception executing SQL", 
            details: stmtError 
          }, { status: 500 })
        }
      }
      
      console.log('Successfully created subscription and credits tables')
      return NextResponse.json({ message: "Database tables created successfully" })
    } catch (error) {
      console.error('Error creating subscription tables:', error)
      return NextResponse.json({ 
        error: "Failed to create database tables", 
        details: error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Unhandled error in create-tables endpoint:", error)
    return NextResponse.json({ 
      error: "Unhandled error in create-tables endpoint", 
      details: error 
    }, { status: 500 })
  }
}
