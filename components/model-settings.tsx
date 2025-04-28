"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { replicateModels } from "@/lib/replicate/models"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface ModelSettingsProps {
  modelId: string
  settings: any
  onSettingsChange: (settings: any) => void
}

export function ModelSettings({ modelId, settings, onSettingsChange }: ModelSettingsProps) {
  const selectedModel = replicateModels.find(m => m.id === modelId)

  if (!selectedModel) {
    return <div>Model not found</div>
  }

  // Handle dimension changes
  const handleDimensionChange = (dimension: "width" | "height", value: number) => {
    const newSettings = { ...settings, [dimension]: value }
    onSettingsChange(newSettings)
  }

  // Handle aspect ratio selection
  const handleAspectRatioChange = (ratio: string) => {
    const [w, h] = ratio.split(":").map(Number)
    const aspectRatio = w / h

    let newWidth, newHeight
    const currentWidth = settings.width || selectedModel.defaultWidth || 512
    const currentHeight = settings.height || selectedModel.defaultHeight || 512
    const maxDim = selectedModel.maxDimension || 1024
    const minDim = selectedModel.minDimension || 512

    // Special handling for common aspect ratios
    if (ratio === "16:9") {
      // For 16:9, prioritize width and calculate height
      newWidth = Math.min(currentWidth, maxDim)
      newHeight = Math.round(newWidth * (9/16))
      console.log(`16:9 ratio: width=${newWidth}, height=${newHeight}`)
    }
    else if (ratio === "9:16") {
      // For 9:16, prioritize height and calculate width
      newHeight = Math.min(currentHeight, maxDim)
      // For 9:16, width should be 9/16 of the height
      newWidth = Math.round(newHeight * (9/16))
      console.log(`9:16 ratio: width=${newWidth}, height=${newHeight}`)
    }
    else {
      // For other ratios, use the general approach
      // Try to maintain the larger dimension when switching aspect ratios
      if (currentWidth >= currentHeight) {
        // Width is the larger dimension, keep it if possible
        newWidth = Math.min(currentWidth, maxDim)
        newHeight = Math.round(newWidth / aspectRatio)

        // If height exceeds max, adjust both dimensions
        if (newHeight > maxDim) {
          newHeight = maxDim
          newWidth = Math.round(newHeight * aspectRatio)
        }
      } else {
        // Height is the larger dimension, keep it if possible
        newHeight = Math.min(currentHeight, maxDim)
        newWidth = Math.round(newHeight * aspectRatio)

        // If width exceeds max, adjust both dimensions
        if (newWidth > maxDim) {
          newWidth = maxDim
          newHeight = Math.round(newWidth / aspectRatio)
        }
      }
    }

    // Ensure dimensions are within model constraints
    newWidth = Math.max(minDim, Math.min(maxDim, newWidth))
    newHeight = Math.max(minDim, Math.min(maxDim, newHeight))

    // Make dimensions divisible by 8 (common requirement for many models)
    newWidth = Math.floor(newWidth / 8) * 8
    newHeight = Math.floor(newHeight / 8) * 8

    // Apply the changes
    onSettingsChange({ ...settings, width: newWidth, height: newHeight })

    // Log for debugging
    console.log(`Changed to aspect ratio ${ratio}: ${newWidth}x${newHeight}`)
  }

  // Common aspect ratios
  const aspectRatios = [
    { label: "1:1", value: "1:1" },
    { label: "4:3", value: "4:3" },
    { label: "3:4", value: "3:4" },
    { label: "16:9", value: "16:9" },
    { label: "9:16", value: "9:16" }
  ]

  // Add a function to force a specific aspect ratio
  const forceAspectRatio = (ratio: string) => {
    console.log(`Forcing aspect ratio: ${ratio}`)
    handleAspectRatioChange(ratio)
  }

  // Calculate current aspect ratio
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a)
    b = Math.abs(b)
    return b === 0 ? a : gcd(b, a % b)
  }

  const currentWidth = settings.width || selectedModel.defaultWidth || 512
  const currentHeight = settings.height || selectedModel.defaultHeight || 512

  // Calculate the actual aspect ratio as a decimal
  const actualRatio = currentWidth / currentHeight

  // Format the ratio as a simple string like "1:1", "4:3", etc. using GCD
  const divisor = gcd(currentWidth, currentHeight)
  let currentRatio = `${Math.round(currentWidth/divisor)}:${Math.round(currentHeight/divisor)}`

  // Find the closest standard aspect ratio
  let closestRatio = null
  let smallestDifference = Infinity

  for (const ratio of aspectRatios) {
    const [w, h] = ratio.value.split(':').map(Number)
    const standardRatio = w / h
    const difference = Math.abs(standardRatio - actualRatio) / standardRatio

    if (difference < smallestDifference) {
      smallestDifference = difference
      closestRatio = ratio.value
    }
  }

  // If we're within 2% of a standard ratio, use that instead
  const isStandardRatio = smallestDifference < 0.02
  if (isStandardRatio) {
    currentRatio = closestRatio || currentRatio
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Model Information</h3>
        <Card className="bg-black/20 border-white/10">
          <CardContent className="pt-4">
            <p className="text-white/80 mb-2"><span className="font-medium">Provider:</span> {selectedModel.provider}</p>
            <p className="text-white/80 mb-2"><span className="font-medium">Description:</span> {selectedModel.description}</p>
            <div className="mb-2">
              <span className="font-medium text-white/80">Strengths:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedModel.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center text-white/80 text-xs">
                    <div className="h-4 w-4 mr-1 text-green-500 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {strength}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Image Dimensions</h3>

        <div className="bg-black/20 border border-white/10 rounded-md p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="width" className="text-white font-medium block mb-2">Width</Label>
              <Input
                type="number"
                id="width"
                value={settings.width || selectedModel.defaultWidth || 512}
                onChange={(e) => handleDimensionChange("width", Number(e.target.value))}
                min={selectedModel.minDimension || 512}
                max={selectedModel.maxDimension || 1024}
                step={8}
                className="bg-black/30 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-white font-medium block mb-2">Height</Label>
              <Input
                type="number"
                id="height"
                value={settings.height || selectedModel.defaultHeight || 512}
                onChange={(e) => handleDimensionChange("height", Number(e.target.value))}
                min={selectedModel.minDimension || 512}
                max={selectedModel.maxDimension || 1024}
                step={8}
                className="bg-black/30 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white font-medium mb-2 block">Aspect Ratio</Label>
            <div className="flex flex-wrap gap-2">
              {aspectRatios.map((ratio) => {
                // Simplified active check
                const isActive = currentRatio === ratio.value

                return (
                  <Button
                    key={ratio.value}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      console.log(`Clicked on ${ratio.value}`)
                      handleAspectRatioChange(ratio.value)
                    }}
                    className={isActive
                      ? "bg-primary text-white font-medium"
                      : "border-white/10 bg-black/30 text-white hover:bg-white/10 hover:border-white/30"}
                  >
                    {ratio.label}
                  </Button>
                )
              })}
              {!isStandardRatio && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-primary text-white font-medium"
                  title={`Current ratio: ${currentWidth}:${currentHeight} (${currentRatio})`}
                >
                  Custom
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Reset button clicked')
                  forceAspectRatio("1:1")
                }}
                className="border-white/10 bg-black/30 text-white hover:bg-white/10 hover:border-white/30"
                title="Reset to square aspect ratio"
              >
                Reset
              </Button>
            </div>
            <p className="text-xs text-white/60 mt-2">Click any aspect ratio to adjust dimensions. Current: {currentWidth}×{currentHeight}</p>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Generation Settings</h3>

        {selectedModel.supportsSteps && (
          <div className="bg-black/20 border border-white/10 rounded-md p-4">
            <div className="flex justify-between">
              <Label htmlFor="num_inference_steps" className="text-white font-medium">Steps: {settings.num_inference_steps || selectedModel.defaultSteps || 30}</Label>
            </div>
            <Slider
              id="num_inference_steps"
              min={1}
              max={selectedModel.additionalParams?.maxSteps || 100}
              step={1}
              value={[settings.num_inference_steps || selectedModel.defaultSteps || 30]}
              onValueChange={(value) => onSettingsChange({ ...settings, num_inference_steps: value[0] })}
              className="[&>span]:bg-primary my-4"
            />
            <p className="text-xs text-white/60">
              Higher values produce more detailed images but take longer
              {selectedModel.additionalParams?.maxSteps && (
                <span className="block mt-1 text-yellow-400">Note: This model has a maximum of {selectedModel.additionalParams.maxSteps} steps</span>
              )}
            </p>
          </div>
        )}

        {selectedModel.supportsGuidanceScale && (
          <div className="bg-black/20 border border-white/10 rounded-md p-4">
            <div className="flex justify-between">
              <Label htmlFor="guidance_scale" className="text-white font-medium">Guidance Scale: {settings.guidance_scale || selectedModel.defaultGuidanceScale || 7.5}</Label>
            </div>
            <Slider
              id="guidance_scale"
              min={1}
              max={20}
              step={0.1}
              value={[settings.guidance_scale || selectedModel.defaultGuidanceScale || 7.5]}
              onValueChange={(value) => onSettingsChange({ ...settings, guidance_scale: value[0] })}
              className="[&>span]:bg-primary my-4"
            />
            <p className="text-xs text-white/60">How closely to follow the prompt (higher = more faithful)</p>
          </div>
        )}

        {selectedModel.supportsSeed && (
          <div className="bg-black/20 border border-white/10 rounded-md p-4">
            <Label htmlFor="seed" className="text-white font-medium block mb-2">Seed (optional)</Label>
            <Input
              type="number"
              id="seed"
              value={settings.seed || ""}
              onChange={(e) => onSettingsChange({ ...settings, seed: e.target.value === "" ? undefined : Number(e.target.value) })}
              placeholder="Random seed"
              className="bg-black/30 border-white/10 text-white mb-2"
            />
            <p className="text-xs text-white/60">Use the same seed for reproducible results</p>
          </div>
        )}

        {/* Model-specific parameters would be added here based on the selected model */}
        {selectedModel.id === "black-forest-labs/flux-pro" && (
          <div className="bg-black/20 border border-white/10 rounded-md p-4">
            <Label htmlFor="high_quality_mode" className="text-white font-medium block mb-2">High Quality Mode</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Switch
                id="high_quality_mode"
                checked={settings.high_quality_mode || false}
                onCheckedChange={(checked) => onSettingsChange({ ...settings, high_quality_mode: checked })}
              />
              <Label htmlFor="high_quality_mode" className="text-white/80">
                {settings.high_quality_mode ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <p className="text-xs text-white/60">Enables higher quality generation (slower)</p>
          </div>
        )}

        {selectedModel.id === "stability-ai/stable-diffusion-3.5-large" && (
          <div className="bg-black/20 border border-white/10 rounded-md p-4">
            <Label htmlFor="refine" className="text-white font-medium block mb-2">Refinement Level</Label>
            <Select
              value={settings.refine || "base_quality"}
              onValueChange={(value) => onSettingsChange({ ...settings, refine: value })}
            >
              <SelectTrigger className="w-full bg-black/30 border-white/10 text-white mb-2">
                <SelectValue placeholder="Select refinement level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base_quality">Base Quality</SelectItem>
                <SelectItem value="high_quality">High Quality</SelectItem>
                <SelectItem value="expert_quality">Expert Quality</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/60">Higher refinement levels produce better results but take longer</p>
          </div>
        )}

        {selectedModel.id === "ideogram-ai/ideogram-v2a" && (
          <div className="bg-black/20 border border-white/10 rounded-md p-4">
            <Label htmlFor="style" className="text-white font-medium block mb-2">Style</Label>
            <Select
              value={settings.style || "none"}
              onValueChange={(value) => onSettingsChange({ ...settings, style: value })}
            >
              <SelectTrigger className="w-full bg-black/30 border-white/10 text-white mb-2">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="photographic">Photographic</SelectItem>
                <SelectItem value="digital-art">Digital Art</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/60">Choose a style for the generated image</p>
          </div>
        )}
      </div>
    </div>
  )
}
