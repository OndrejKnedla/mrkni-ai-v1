"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from "react" // Added useMemo
import { createClient } from "@/lib/supabase/client" // Import the createClient function
import type { User, SupabaseClient } from "@supabase/supabase-js" // Import SupabaseClient type

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Get the Supabase client instance using the function
  // Use useMemo to ensure the client is created only once per component instance
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Ensure supabase client is available before proceeding
    if (!supabase) {
      console.error("Supabase client not available in AuthProvider useEffect");
      setLoading(false); // Stop loading if client fails
      return;
    }

    // Check for active session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign-in process...")

      // Get the current URL to use as base for the redirect
      const baseUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'http://localhost:3000';

      console.log(`Using base URL for redirect: ${baseUrl}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          queryParams: {
            access_type: "offline", // Keep this if refresh tokens are needed
            prompt: "consent", // Force consent screen to ensure we get refresh token
          },
          scopes: "email profile", // Explicitly request these scopes
        },
      })

      if (error) {
        console.error("Google sign-in error:", error)
        throw error
      }

      console.log("Sign in initiated successfully, redirecting to Google", data);
    } catch (error) {
      console.error("Error in signInWithGoogle:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
