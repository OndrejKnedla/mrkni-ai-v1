"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { replicateModels } from "@/lib/replicate/models"
import type { ModelTier } from "@/lib/config"
import { Check } from "lucide-react"

interface ModelSelectorProps {
  value: string
  onValueChange: (value: string) => void
  userTier: ModelTier
}

export function ModelSelector({ value, onValueChange, userTier }: ModelSelectorProps) {
  // Sort models by tier (free first) and then by name
  const sortedModels = [...replicateModels].sort((a, b) => {
    const tierOrder = { free: 0, basic: 1, premium: 2 }
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[a.tier] - tierOrder[b.tier]
    }
    return a.name.localeCompare(b.name)
  })

  // Logic to check if a model tier is accessible
  const tierLevels: Record<ModelTier, number> = { free: 0, basic: 1, premium: 2 }
  const userTierLevel = tierLevels[userTier]

  const isModelAccessible = (modelTier: ModelTier) => {
    const modelTierLevel = tierLevels[modelTier]
    return modelTierLevel <= userTierLevel
  }

  // Get tier badge styling
  const getTierBadgeStyle = (tier: ModelTier) => {
    switch(tier) {
      case "premium":
        return "bg-green-600 text-white"
      case "basic":
        return "bg-orange-500 text-white"
      case "free":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  // Capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  return (
    <div>
      <Label htmlFor="model" className="text-white">AI Model</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {sortedModels.map((m) => {
            const accessible = isModelAccessible(m.tier)
            const isSelected = value === m.id
            return (
              <SelectItem
                key={m.id}
                value={m.id}
                disabled={!accessible}
                className={!accessible ? "opacity-50" : ""}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {isSelected && (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    )}
                    <span>{m.name}</span>
                  </div>
                  <Badge className={`ml-2 ${getTierBadgeStyle(m.tier)}`}>
                    {capitalizeFirstLetter(m.tier)}
                  </Badge>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
