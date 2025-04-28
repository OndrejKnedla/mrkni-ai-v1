"use client"

import { Button } from "@/components/ui/button"
import { Droplet } from "lucide-react"

interface CreditPurchaseCardProps {
  credits: number
  bonusCredits?: number
  price: number
  isFlashSale?: boolean
  onPurchase: (price: number, credits: number) => void
}

export function CreditPurchaseCard({
  credits,
  bonusCredits = 0,
  price,
  isFlashSale = false,
  onPurchase,
}: CreditPurchaseCardProps) {
  const totalCredits = credits + bonusCredits

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-md overflow-hidden">
      {/* Credits display */}
      <div className="p-4 relative">
        <div className="flex items-center">
          <Droplet className="h-5 w-5 text-primary mr-2" />
          <span className="text-2xl font-bold text-white">{totalCredits}</span>
          {isFlashSale && (
            <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-1 rounded font-medium">
              Flash Sale
            </span>
          )}
        </div>
        {bonusCredits > 0 && (
          <div className="text-xs text-white/70 mt-1">
            Total: {credits} + {bonusCredits} bonus
          </div>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path d="M12 2L4 12H20L12 22V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Price and purchase button */}
      <div className="p-3 flex items-center justify-between border-t border-white/10">
        <span className="text-xl font-bold text-white">${price}</span>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => onPurchase(price, totalCredits)}
        >
          Purchase Now
        </Button>
      </div>
    </div>
  )
}
