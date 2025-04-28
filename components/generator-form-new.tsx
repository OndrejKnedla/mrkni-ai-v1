"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/context/subscription-context";
// Import refreshHistory from useHistory
import { useHistory } from "@/context/history-context";
import { Loader2 } from "lucide-react";
import TextareaAutosize from 'react-textarea-autosize';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "./ui-overrides"
import { modelConfig, type ModelTier } from "@/lib/config"
// Import HistoryItem type
import type { GenerationParams, GenerationResult, HistoryItem } from "@/lib/types"
import { generateImage, checkGenerationStatus } from "@/lib/replicate"
import { useAuth } from "@/context/auth-context"
import { ModelSelector } from "@/components/model-selector"
import { ModelSettings } from "@/components/model-settings"
import { replicateModels } from "@/lib/replicate/models"

interface GeneratorFormProps {
  initialPrompt?: string
  initialNegativePrompt?: string
  initialImage?: string
  onGenerationComplete: (result: GenerationResult) => void
}

export function GeneratorForm({
  initialPrompt = "",
  initialNegativePrompt = "",
  initialImage,
  onGenerationComplete,
}: GeneratorFormProps) {
  const { subscription, hasCredits, useCredit } = useSubscription();
  // Destructure refreshHistory
  const { addToHistory, refreshHistory } = useHistory();
  const { toast } = useToast();

  // Combined state for all form settings
  const [formState, setFormState] = useState({
    prompt: initialPrompt,
    negative_prompt: initialNegativePrompt,
    image: initialImage,
    width: 512,
    height: 512,
    num_inference_steps: modelConfig.defaultSteps,
    guidance_scale: modelConfig.defaultGuidance,
    num_images: modelConfig.defaultNumImages,
    scheduler: modelConfig.schedulers[0].value,
    seed: undefined as number | undefined,
    model: modelConfig.defaultModel,
    // Model-specific parameters will be added dynamically
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [historyAdded, setHistoryAdded] = useState(false); // Flag to track if history was added
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Effect to sync state with props
  useEffect(() => {
    setFormState(prev => ({ ...prev, prompt: initialPrompt }))
  }, [initialPrompt])

  useEffect(() => {
    setFormState(prev => ({ ...prev, negative_prompt: initialNegativePrompt }))
  }, [initialNegativePrompt])

  useEffect(() => {
    setFormState(prev => ({ ...prev, image: initialImage }))
  }, [initialImage])

  // Get the selected model
  const selectedModel = replicateModels.find(m => m.id === formState.model) || null

  // Logic to check if a model tier is accessible
  const tierLevels: Record<ModelTier, number> = { free: 0, basic: 1, premium: 2 }
  const userTier = subscription?.tier || "free"
  const userTierLevel = tierLevels[userTier]

  const isModelAccessible = (modelTier: ModelTier) => {
    const modelTierLevel = tierLevels[modelTier]
    return modelTierLevel <= userTierLevel
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMessage(null) // Clear previous messages

    // --- Credit Check ---
    if (!hasCredits("image")) {
      setFormMessage({ type: 'error', text: "No credits left. Please upgrade your plan." })
      return
    }

    // --- Model Check ---
    if (!selectedModel || !isModelAccessible(selectedModel.tier)) {
      toast({
        title: "Model Not Accessible",
        description: "Please select a model available for your subscription tier.",
        variant: "destructive",
      })
      setFormMessage({ type: 'error', text: "Please select a model available for your subscription tier." })
      return
    }

    // --- Prompt Check ---
    if (!formState.prompt.trim()) {
      setFormMessage({ type: 'error', text: "Please enter a prompt." })
      return
    }

    setIsGenerating(true)
    setHistoryAdded(false); // Reset flag for new generation
    try {
      // Use the entire formState as params
      // This automatically includes any model-specific parameters
      const params: GenerationParams = {
        ...formState,
        model: selectedModel.id,
      }

      // --- Start Generation ---
      const initialResult = await generateImage(params)

      // Check if the initial call itself failed
      if (!initialResult || !initialResult.id || (initialResult.status !== 'starting' && initialResult.status !== 'processing')) {
        const startErrorMessage = initialResult?.error || "Failed to start generation process."
        setFormMessage({ type: 'error', text: startErrorMessage })
        setIsGenerating(false)
        return
      }

      // --- Poll for results ---
      setFormMessage({ type: 'info', text: "Generation started. Waiting for results..." })

      const maxAttempts = 30 // 30 attempts * 2 seconds = 60 seconds max wait
      let attempts = 0
      let finalResult = initialResult

      // Store the model name from the initial result if available
      if (initialResult.model) {
        // The model name is already in initialResult.model
        console.log("Model name from initial result:", initialResult.model)
      }

      while (attempts < maxAttempts && (finalResult.status === 'starting' || finalResult.status === 'processing')) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between polls

        try {
          finalResult = await checkGenerationStatus(initialResult.id)
          attempts++

          if (finalResult.status === 'succeeded') {
            break // Exit the loop if generation succeeded
          } else if (finalResult.status === 'failed' || finalResult.status === 'canceled') {
            break // Exit the loop if generation failed or was canceled
          }

          // Update the message with current status and attempt count
          setFormMessage({
            type: 'info',
            text: `Generation in progress... (${attempts}/${maxAttempts})`
          })
        } catch (pollError) {
          console.error("Error polling for status:", pollError)
          // Continue the loop despite errors, to give more chances for success
        }
      }

      // --- Handle Final Result ---
      // Log the finalResult object when status is succeeded
      if (finalResult?.status === 'succeeded') {
        console.log("Final successful result from Replicate:", JSON.stringify(finalResult, null, 2));
      }

      if (finalResult && finalResult.status === 'succeeded' && finalResult.output && finalResult.output.length > 0) {
        // Credit is already deducted in the API, no need to call useCredit here
        // await useCredit("image") // This was causing double credit deduction

        // Construct a proper HistoryItem before saving
        const historyEntry: HistoryItem = {
          id: finalResult.id,
          status: finalResult.status,
          input: { // Map input fields carefully from Replicate's input structure
            prompt: finalResult.input.prompt,
            negative_prompt: finalResult.input.negative_prompt,
            width: finalResult.input.width,
            height: finalResult.input.height,
            num_inference_steps: finalResult.input.num_inference_steps,
            guidance_scale: finalResult.input.guidance_scale,
            num_images: finalResult.output.length, // Use actual output length
            scheduler: finalResult.input.scheduler,
            seed: finalResult.input.seed,
            // Use the model from the form state, as Replicate might not return it consistently in 'input'
            model: formState.model,
          },
          output: finalResult.output, // Use the output URLs from Replicate result
          created_at: finalResult.created_at, // Use Replicate's created_at timestamp
          model: formState.model, // Use model from form state here too for display consistency
          type: 'image', // Explicitly set type
          error: finalResult.error, // Include error if present (though status is succeeded)
        };

        // Only add to history if it hasn't been added for this generation yet
        if (!historyAdded) {
          await addToHistory(historyEntry, 'image'); // Pass type 'image'
          setHistoryAdded(true); // Set flag to prevent duplicates
          // Refresh history after successfully adding
          await refreshHistory();
          console.log("History refreshed after adding image generation.");
        }
        onGenerationComplete(finalResult); // Pass raw result to callback if needed elsewhere
        setFormMessage(null); // Clear info message on success
      } else {
        // Handle failed, canceled, or timed-out polls
        let endErrorMessage = "Image generation failed or timed out."
        if (finalResult?.status === 'failed') {
          endErrorMessage = `Generation failed: ${finalResult.error || 'Unknown reason'}`
        } else if (finalResult?.status === 'canceled') {
          endErrorMessage = "Generation canceled."
        } else if (attempts >= maxAttempts) {
          endErrorMessage = "Generation timed out while waiting for results."
        }
        setFormMessage({ type: 'error', text: endErrorMessage })
      }
    } catch (error: any) {
      const initialErrorMessage = error.message || "An unexpected error occurred before starting generation."
      setFormMessage({ type: 'error', text: initialErrorMessage })
    }
    setIsGenerating(false)
  }

  return (
    <GlassCard className="w-full">
      <GlassCardHeader>
        <GlassCardTitle>Image Generator</GlassCardTitle>
        <GlassCardDescription>Generate images using AI</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="prompt" className="text-white">Prompt</Label>
            <TextareaAutosize
              id="prompt"
              value={formState.prompt}
              onChange={(e) => setFormState(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="Enter your prompt"
              required
              className="w-full resize-none bg-black/20 border-white/10 text-white placeholder:text-white/50 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              minRows={3}
            />
          </div>

          <div>
            <Label htmlFor="negative-prompt" className="text-white">Negative Prompt (Optional)</Label>
            <TextareaAutosize
              id="negative-prompt"
              value={formState.negative_prompt}
              onChange={(e) => setFormState(prev => ({ ...prev, negative_prompt: e.target.value }))}
              placeholder="Enter negative prompt (optional)"
              className="w-full resize-none bg-black/20 border-white/10 text-white placeholder:text-white/50 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              minRows={2}
            />
          </div>

          {/* Model Selector */}
          <ModelSelector
            value={formState.model}
            onValueChange={(value) => setFormState(prev => ({ ...prev, model: value }))}
            userTier={subscription?.tier || "free"}
          />

          {/* Model-specific settings */}
          {selectedModel && (
            <ModelSettings
              modelId={selectedModel.id}
              settings={formState}
              onSettingsChange={setFormState}
            />
          )}

          {/* Form message display */}
          {formMessage && (
            <div className={`p-3 rounded-md ${
              formMessage.type === 'error' ? 'bg-red-500/20 text-red-200' :
              formMessage.type === 'success' ? 'bg-green-500/20 text-green-200' :
              'bg-blue-500/20 text-blue-200'
            }`}>
              <div className="flex items-center">
                {formMessage.type === 'error' && <span className="mr-2">⚠️</span>}
                {formMessage.type === 'success' && <span className="mr-2">✅</span>}
                {formMessage.type === 'info' && <span className="mr-2">ℹ️</span>}
                <p>{formMessage.text}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isGenerating || !selectedModel || !isModelAccessible(selectedModel.tier)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Images"
            )}
          </Button>
        </form>
      </GlassCardContent>
    </GlassCard>
  )
}
