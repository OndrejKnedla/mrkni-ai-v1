"use client"

import { useEffect, Suspense } from "react" // Import Suspense
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui-overrides"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react" // Import Loader2

// Inner component to render the content, receiving errorMessage as prop
function AuthErrorContent({ errorMessage }: { errorMessage: string }) {
  const router = useRouter()

  // Log the error for debugging
  useEffect(() => {
    console.error("Auth error:", errorMessage)
  }, [errorMessage])

  return (
    <GlassCard className="w-full max-w-md">
        <GlassCardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <GlassCardTitle>Authentication Error</GlassCardTitle>
          <GlassCardDescription>
            There was a problem during the authentication process.
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="p-4 bg-red-500/10 rounded-md border border-red-500/20 text-center"> {/* Centered text */}
            <p className="text-sm text-white">{errorMessage}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">What you can try:</h3>
            <ul className="list-disc pl-5 text-sm text-white/80 space-y-2">
              <li>Make sure you're using a valid Google account</li>
              <li>Check your internet connection</li>
              <li>Clear your browser cookies and cache</li>
              <li>Try signing in again</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={() => router.push("/")}
              className="bg-white text-emerald-900 hover:bg-gray-100"
            >
              Try Again
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-white">
      <Loader2 className="h-8 w-8 animate-spin mb-2" />
      <p>Loading error details...</p>
    </div>
  );
}

// Main page component that uses Suspense
export default function AuthErrorPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Suspense fallback={<LoadingFallback />}>
        <AuthErrorPageContent />
      </Suspense>
    </div>
  )
}

// Wrapper component to read searchParams outside Suspense boundary
function AuthErrorPageContent() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get("message") || "An unknown error occurred during authentication."
  return <AuthErrorContent errorMessage={errorMessage} />
}
