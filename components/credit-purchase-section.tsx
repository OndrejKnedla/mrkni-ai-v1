"use client"

import { useState } from "react"
import { CreditPurchaseCard } from "./credit-purchase-card"
import { useAuth } from "@/context/auth-context"
import { useSubscription } from "@/context/subscription-context"
import { Loader2 } from "lucide-react"
import { GlassCard } from "./ui-overrides"
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

export function CreditPurchaseSection() {
  const { user } = useAuth()
  const { refreshSubscription } = useSubscription()
  const [processing, setProcessing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const creditPackages = [
    { credits: 330, price: 5, bonusCredits: 0, isFlashSale: false },
    { credits: 660, price: 10, bonusCredits: 0, isFlashSale: false },
    { credits: 1320, price: 20, bonusCredits: 0, isFlashSale: false },
    { credits: 3300, price: 50, bonusCredits: 200, isFlashSale: true },
    { credits: 7500, price: 100, bonusCredits: 1000, isFlashSale: true },
    { credits: 16000, price: 200, bonusCredits: 2800, isFlashSale: true },
    { credits: 48000, price: 600, bonusCredits: 8400, isFlashSale: true },
    { credits: 96000, price: 1200, bonusCredits: 16800, isFlashSale: true },
  ]

  const handlePurchaseCredits = async (price: number, credits: number) => {
    if (!user) return

    setProcessing(true)
    setPurchaseError(null)

    try {
      // Call your API to create a checkout session for credits
      const response = await fetch('/api/create-credit-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price,
          credits,
          productType: 'credits'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.statusText}`)
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe checkout
      const stripe = await import('@stripe/stripe-js').then(module => module.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!))

      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId })

      if (error) {
        throw new Error(error.message || 'An unexpected error occurred during checkout redirection.')
      }
    } catch (error) {
      console.error("Credit purchase failed:", error)
      const message = error instanceof Error ? error.message : "An unknown error occurred during checkout."
      setPurchaseError(message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white drop-shadow-md">Purchase Credits</h2>
        <p className="text-white/70 mt-2 max-w-2xl mx-auto">
          Get credits to generate images and videos with our advanced AI models.
        </p>
      </div>

      {/* Display Purchase Error */}
      {purchaseError && (
        <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded max-w-md mx-auto text-center">
          <p><strong>Purchase Error:</strong> {purchaseError}</p>
        </div>
      )}

      {processing && (
        <div className="my-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-white">Processing your purchase...</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {creditPackages.slice(0, 4).map((pkg, index) => (
          <CreditPurchaseCard
            key={index}
            credits={pkg.credits}
            bonusCredits={pkg.bonusCredits}
            price={pkg.price}
            isFlashSale={pkg.isFlashSale}
            onPurchase={handlePurchaseCredits}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto mt-4">
        {creditPackages.slice(4).map((pkg, index) => (
          <CreditPurchaseCard
            key={index + 4}
            credits={pkg.credits}
            bonusCredits={pkg.bonusCredits}
            price={pkg.price}
            isFlashSale={pkg.isFlashSale}
            onPurchase={handlePurchaseCredits}
          />
        ))}
      </div>


    </div>
  )
}
