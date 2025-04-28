"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { getAvailableAgents, type AgentTier, type MrkniAIAgent } from "@/lib/agents"

interface AgentSelectorProps {
  value: string
  onValueChange: (value: string) => void
  userTier: AgentTier
}

export function AgentSelector({ value, onValueChange, userTier }: AgentSelectorProps) {
  const [availableAgents, setAvailableAgents] = useState<MrkniAIAgent[]>([])

  useEffect(() => {
    // Get agents available for the user's tier
    const agents = getAvailableAgents(userTier)
    setAvailableAgents(agents)

    // If the current value is not in the available agents, select the first one
    if (agents.length > 0 && !agents.some(agent => agent.id === value)) {
      onValueChange(agents[0].id)
    }
  }, [userTier, value, onValueChange])

  // Function to get badge style based on tier
  const getTierBadgeStyle = (tier: AgentTier) => {
    switch (tier) {
      case "premium":
        return "bg-green-500/20 text-green-500 border-green-500/30"
      case "basic":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30"
      case "pro":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Function to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  return (
    <div>
      <Label htmlFor="agent" className="text-white">AI Agent</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {availableAgents.map((agent) => {
            const isSelected = value === agent.id
            return (
              <SelectItem
                key={agent.id}
                value={agent.id}
                className="focus:bg-primary/20"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {isSelected && (
                      <Check className="h-4 w-4 mr-2 text-primary" />
                    )}
                    <span>{agent.name}</span>
                  </div>
                  <Badge className={`ml-2 ${getTierBadgeStyle(agent.tier)}`}>
                    {capitalizeFirstLetter(agent.tier)}
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
