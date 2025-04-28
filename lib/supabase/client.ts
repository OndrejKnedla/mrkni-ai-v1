import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Store the client instance to avoid recreating it unnecessarily
let client: SupabaseClient | undefined

function createClient(): SupabaseClient | undefined { // Update return type
  if (client) {
    return client
  }

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log the error, but crucially, return undefined to prevent client creation
    console.error('Client Supabase URL or Anon Key is missing. Cannot create client.');
    return undefined; // Return undefined if env vars are missing
  }

  // Create the client only if variables are present
  console.log("Creating Supabase client-side instance."); // Add log for confirmation
  client = createBrowserClient(
    supabaseUrl, // No need for '!' as we checked above
    supabaseAnonKey, // No need for '!' as we checked above
    {
      // No specific auth options needed here when using @supabase/ssr helpers
    }
  )
  return client
}

// Export the function to create/get the client
export { createClient }
