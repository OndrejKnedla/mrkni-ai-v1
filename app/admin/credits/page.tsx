"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard } from "@/components/ui-overrides"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminCreditsPage() {
  const { user, loading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleAddMonthlyCredits = async () => {
    if (!confirm("Are you sure you want to add 1250 credits to all active users? This action cannot be undone.")) {
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/add-monthly-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Successfully added monthly credits",
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to add monthly credits",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An unexpected error occurred",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-white drop-shadow-md">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Unauthorized</CardTitle>
            <CardDescription className="text-white/70">
              You must be logged in to access this page.
            </CardDescription>
          </CardHeader>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow-md mb-8 text-center">
        Admin Credit Management
      </h1>

      <div className="grid gap-8 max-w-4xl mx-auto">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Add Monthly Credits</CardTitle>
            <CardDescription className="text-white/70">
              Add monthly credits to users based on their subscription tier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-white/80 mb-4">
              This action will add monthly credits to all users with active subscriptions based on their tier:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Basic: +1250 credits</li>
                <li>Premium: +4000 credits</li>
                <li>Pro: +10000 credits</li>
              </ul>
              This is typically done once per month.
            </p>
            {result && (
              <Alert className={result.success ? "bg-green-900/20" : "bg-red-900/20"} variant="default">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle className={result.success ? "text-green-500" : "text-red-500"}>
                  {result.success ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription className="text-white/80">{result.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAddMonthlyCredits}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Monthly Credits"
              )}
            </Button>
          </CardFooter>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Credit System Information</CardTitle>
            <CardDescription className="text-white/70">
              Information about the credit system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Monthly Credit Addition</h3>
                <p className="text-white/80">
                  Each month, users receive additional credits based on their subscription tier:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/80">
                  <li>Basic: +1250 credits per month</li>
                  <li>Premium: +4000 credits per month</li>
                  <li>Pro: +10000 credits per month</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Credit Allocation by Tier</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  <li>Free: 50 initial credits</li>
                  <li>Basic: 1250 initial credits + 1250 monthly credits</li>
                  <li>Premium: 4000 initial credits + 4000 monthly credits</li>
                  <li>Pro: 10000 initial credits + 10000 monthly credits</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Credit Savings by Tier</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  <li>Free: No savings (100 credits used = 100 credits deducted)</li>
                  <li>Basic: 10% savings (100 credits used = 90 credits deducted)</li>
                  <li>Premium: 20% savings (100 credits used = 80 credits deducted)</li>
                  <li>Pro: 40% savings (100 credits used = 60 credits deducted)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
