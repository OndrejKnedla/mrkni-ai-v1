import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Function for server components and route handlers
export function createServerActionClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials for server action client');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Add async/await to satisfy potential type mismatch
      async get(name: string) {
        // Await the cookieStore call, although it should be sync here
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options: CookieOptions) {
        // Await the cookieStore call
        await (await cookieStore).set({ name, value, ...options })
      },
      async remove(name: string, options: CookieOptions) {
        // Await the cookieStore call
        await (await cookieStore).delete({ name, ...options })
      },
    },
  })
}

// Function for middleware
export function createMiddlewareClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials for middleware client');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
       // Add async/await to satisfy potential type mismatch
      async get(name: string) {
        // Await the cookieStore call
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options: CookieOptions) {
        // Middleware needs try/catch for set/remove
        try {
           // Await the cookieStore call
          await (await cookieStore).set({ name, value, ...options })
        } catch (error) {
          // Ignore errors in middleware
        }
      },
      async remove(name: string, options: CookieOptions) {
        // Middleware needs try/catch for set/remove
        try {
           // Await the cookieStore call
          await (await cookieStore).delete({ name, ...options })
        } catch (error) {
          // Ignore errors in middleware
        }
      },
    },
  })
}
