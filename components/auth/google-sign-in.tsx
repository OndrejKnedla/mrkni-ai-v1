"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "../ui-overrides"
import { toast } from "@/components/ui/use-toast"

export function GoogleSignIn() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Initializing...")
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check for auth error in URL
    const authError = searchParams.get("auth_error")
    if (authError) {
      toast({
        title: "Authentication failed",
        description: authError,
        variant: "destructive",
      })

      // Remove the error from URL to prevent showing it again on refresh
      const url = new URL(window.location.href)
      url.searchParams.delete("auth_error")
      router.replace(url.pathname + url.search)
    }

    // Reset loading state if we're back on this page
    setIsLoading(false)
    setLoadingMessage("Initializing...")
  }, [searchParams, router])

  const handleSignIn = async () => {
    setIsLoading(true)
    setLoadingMessage("Connecting to Google...")

    try {
      // Set a timeout to show a message if it's taking too long
      const timeoutId = setTimeout(() => {
        setLoadingMessage("Still working... Google authentication can take a moment.")
      }, 5000);

      await signInWithGoogle()

      // Clear the timeout if we get here
      clearTimeout(timeoutId);

      // Update loading message
      setLoadingMessage("Redirecting to Google...")

      // The page will redirect to the OAuth provider, so we don't need to handle success here
      // But we'll add a fallback timeout in case the redirect doesn't happen
      setTimeout(() => {
        setLoadingMessage("Waiting for Google response...")

        // If we're still here after 10 seconds, something might be wrong
        setTimeout(() => {
          setIsLoading(false)
          toast({
            title: "Authentication delayed",
            description: "The Google authentication process is taking longer than expected. Please try again.",
            variant: "destructive",
          })
        }, 10000)
      }, 3000)
    } catch (error: any) {
      console.error("Google sign-in error:", error)
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <GlassCard className="w-full">
      <GlassCardHeader className="text-center">
        <GlassCardTitle>Sign In to MrkniAI</GlassCardTitle>
        <GlassCardDescription>Continue with Google to generate AI images and videos</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <Button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center bg-white text-emerald-900 hover:bg-gray-100"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingMessage}
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
      </GlassCardContent>
    </GlassCard>
  )
}
