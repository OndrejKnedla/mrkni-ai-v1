"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAgentById, agentConfig } from "@/lib/agents"

interface AgentSettingsProps {
  agentId: string
  settings: any
  onSettingsChange: (settings: any) => void
}

export function AgentSettings({ agentId, settings, onSettingsChange }: AgentSettingsProps) {
  const selectedAgent = getAgentById(agentId)

  if (!selectedAgent) {
    return <div className="text-white/70">No agent selected</div>
  }

  // Handle aspect ratio selection
  const handleAspectRatioChange = (ratio: string) => {
    const [w, h] = ratio.split(":").map(Number)
    const aspectRatio = w / h

    let newWidth, newHeight
    const currentWidth = settings.width || selectedAgent.defaultWidth || 1024
    const currentHeight = settings.height || selectedAgent.defaultHeight || 1024
    const maxDim = selectedAgent.maxDimension || 1024
    const minDim = selectedAgent.minDimension || 512

    // Special handling for common aspect ratios
    if (ratio === "16:9") {
      newWidth = Math.min(maxDim, 1024)
      newHeight = Math.round(newWidth * (9/16))
    }
    else if (ratio === "9:16") {
      newHeight = Math.min(maxDim, 1024)
      newWidth = Math.round(newHeight * (9/16))
    }
    else if (ratio === "21:9") {
      newWidth = Math.min(maxDim, 1024)
      newHeight = Math.round(newWidth * (9/21))
    }
    else if (ratio === "9:21") {
      newHeight = Math.min(maxDim, 1024)
      newWidth = Math.round(newHeight * (9/21))
    }
    else {
      // For other ratios, use the general approach
      if (currentWidth >= currentHeight) {
        newWidth = Math.min(currentWidth, maxDim)
        newHeight = Math.round(newWidth / aspectRatio)

        if (newHeight > maxDim) {
          newHeight = maxDim
          newWidth = Math.round(newHeight * aspectRatio)
        }
      } else {
        newHeight = Math.min(currentHeight, maxDim)
        newWidth = Math.round(newHeight * aspectRatio)

        if (newWidth > maxDim) {
          newWidth = maxDim
          newHeight = Math.round(newWidth / aspectRatio)
        }
      }
    }

    // Ensure dimensions are within agent constraints
    newWidth = Math.max(minDim, Math.min(maxDim, newWidth))
    newHeight = Math.max(minDim, Math.min(maxDim, newHeight))

    // Make dimensions divisible by 8 (common requirement for many models)
    newWidth = Math.floor(newWidth / 8) * 8
    newHeight = Math.floor(newHeight / 8) * 8

    // Apply the changes
    onSettingsChange({ ...settings, width: newWidth, height: newHeight })
  }

  // Calculate current aspect ratio
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a)
    b = Math.abs(b)
    return b === 0 ? a : gcd(b, a % b)
  }

  const currentWidth = settings.width || selectedAgent.defaultWidth || 1024
  const currentHeight = settings.height || selectedAgent.defaultHeight || 1024
  const divisor = gcd(currentWidth, currentHeight)
  let currentRatio = `${Math.round(currentWidth/divisor)}:${Math.round(currentHeight/divisor)}`

  // Check if current ratio matches any standard ratio
  const isStandardRatio = agentConfig.aspectRatios.some(r => r.value === currentRatio)

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Selector */}
      <div className="bg-black/20 border border-white/10 rounded-md p-4">
        <Label htmlFor="aspect_ratio" className="text-white font-medium block mb-2">Aspect Ratio</Label>
        <Select
          value={currentRatio}
          onValueChange={(value) => handleAspectRatioChange(value)}
        >
          <SelectTrigger className="w-full bg-black/30 border-white/10 text-white">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            {agentConfig.aspectRatios.map((ratio) => (
              <SelectItem key={ratio.value} value={ratio.value}>
                {ratio.label}
              </SelectItem>
            ))}
            {!isStandardRatio && (
              <SelectItem value={currentRatio}>
                Custom ({currentRatio})
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-white/60 mt-2">Current dimensions: {currentWidth}×{currentHeight}</p>
      </div>

      <Separator className="bg-white/10" />

      {/* Number of Outputs */}
      <div className="bg-black/20 border border-white/10 rounded-md p-4">
        <Label htmlFor="num_outputs" className="text-white font-medium block mb-2">Number of Outputs</Label>
        <Select
          value={settings.num_outputs?.toString() || "1"}
          onValueChange={(value) => onSettingsChange({ ...settings, num_outputs: parseInt(value) })}
        >
          <SelectTrigger className="w-full bg-black/30 border-white/10 text-white">
            <SelectValue placeholder="Select number of outputs" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-white/60 mt-2">Generate multiple images with one click</p>
      </div>

      <Separator className="bg-white/10" />

      {/* Advanced Settings */}
      <div className="bg-black/20 border border-white/10 rounded-md p-4">
        <h3 className="text-white font-medium mb-4">Advanced Settings</h3>

        {selectedAgent.supportsSteps && (
          <div className="mb-4">
            <Label htmlFor="num_inference_steps" className="text-white">Steps</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="num_inference_steps"
                min={1}
                max={selectedAgent.additionalParams?.maxSteps || 50}
                step={1}
                value={[settings.num_inference_steps || selectedAgent.defaultSteps || 30]}
                onValueChange={(value) => onSettingsChange({ ...settings, num_inference_steps: value[0] })}
                className="flex-1 [&>span]:bg-primary"
              />
              <span className="text-white min-w-[40px] text-right">
                {settings.num_inference_steps || selectedAgent.defaultSteps || 30}
              </span>
            </div>
          </div>
        )}

        {selectedAgent.supportsGuidanceScale && (
          <div className="mb-4">
            <Label htmlFor="guidance_scale" className="text-white">Guidance Scale</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="guidance_scale"
                min={1}
                max={20}
                step={0.1}
                value={[settings.guidance_scale || selectedAgent.defaultGuidanceScale || 7.5]}
                onValueChange={(value) => onSettingsChange({ ...settings, guidance_scale: value[0] })}
                className="flex-1 [&>span]:bg-primary"
              />
              <span className="text-white min-w-[40px] text-right">
                {(settings.guidance_scale || selectedAgent.defaultGuidanceScale || 7.5).toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {selectedAgent.supportsSeed && (
          <div>
            <Label htmlFor="seed" className="text-white">Seed (optional)</Label>
            <Input
              type="number"
              id="seed"
              value={settings.seed || ""}
              onChange={(e) => onSettingsChange({
                ...settings,
                seed: e.target.value === "" ? undefined : parseInt(e.target.value)
              })}
              placeholder="Random seed"
              className="bg-black/30 border-white/10 text-white"
            />
            <p className="text-xs text-white/60 mt-1">Use the same seed for reproducible results</p>
          </div>
        )}
      </div>
    </div>
  )
}
