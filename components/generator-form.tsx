"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TextareaAutosize from 'react-textarea-autosize'
import { useToast } from "@/components/ui/use-toast"
import { useSubscription } from "@/context/subscription-context"
import { useHistory } from "@/context/history-context"
import { Loader2, Lock, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "./ui-overrides"
import { modelConfig, type ModelTier } from "@/lib/config"
import type { GenerationParams, GenerationResult } from "@/lib/types"
import { generateImage } from "@/lib/replicate"
// import { useAuth } from "@/context/auth-context" // Unused import
import { cn } from "@/lib/utils"
import { checkGenerationStatus } from "@/lib/replicate"
// Removed unused imports

interface GeneratorFormProps {
  initialPrompt?: string
  initialNegativePrompt?: string
  initialImage?: string // Add initialImage prop
  onGenerationComplete: (result: GenerationResult) => void
}

export function GeneratorForm({
  initialPrompt = "",
  initialNegativePrompt = "",
  initialImage, // Destructure initialImage
  onGenerationComplete,
}: GeneratorFormProps) {
  // const { user } = useAuth() // Unused variable
  const { subscription, hasCredits } = useSubscription() // Removed useCredit as it's no longer needed
  const { addToHistory } = useHistory()
  const { toast } = useToast()

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

  // Convenience getters and setters
  const prompt = formState.prompt
  const negativePrompt = formState.negative_prompt
  // const imageData = formState.image // Unused variable
  const model = formState.model
  const width = formState.width
  const height = formState.height
  const numInferenceSteps = formState.num_inference_steps
  const guidanceScale = formState.guidance_scale
  const numImages = formState.num_images
  const scheduler = formState.scheduler
  const seed = formState.seed

  // Update a single form field
  const updateFormField = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  // Convenience setters
  const setPrompt = (value: string) => updateFormField('prompt', value)
  const setNegativePrompt = (value: string) => updateFormField('negative_prompt', value)
  const setModel = (value: string) => updateFormField('model', value)
  const setWidth = (value: number) => updateFormField('width', value)
  const setHeight = (value: number) => updateFormField('height', value)
  const setNumInferenceSteps = (value: number) => updateFormField('num_inference_steps', value)
  const setGuidanceScale = (value: number) => updateFormField('guidance_scale', value)
  const setNumImages = (value: number) => updateFormField('num_images', value)
  const setScheduler = (value: string) => updateFormField('scheduler', value)
  const setSeed = (value: number | undefined) => updateFormField('seed', value)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null) // Added 'info' type

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


  // Use the full list of models
  const allModels = modelConfig.models
  const selectedModel = allModels.find((m) => m.id === model) // Find selected from all models

  // Logic to check if a model tier is accessible
  const tierLevels: Record<ModelTier, number> = { free: 0, basic: 1, premium: 2 }
  const userTier = subscription?.tier || "free"
  const userTierLevel = tierLevels[userTier]

  const isModelAccessible = (modelTier: ModelTier) => {
    const modelTierLevel = tierLevels[modelTier]
    return modelTierLevel <= userTierLevel
  }

  // Sort models: accessible first, then inaccessible
  const sortedModels = [...allModels].sort((a, b) => {
    const accessibleA = isModelAccessible(a.tier)
    const accessibleB = isModelAccessible(b.tier)
    if (accessibleA && !accessibleB) return -1 // a comes first
    if (!accessibleA && accessibleB) return 1  // b comes first
    return 0 // Keep original order among accessible/inaccessible groups
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMessage(null) // Clear previous messages

    // --- Credit Check ---
    // Note: The backend now also checks subscription/tier, but a frontend check is good UX.
    // This example assumes a simple 'hasCredits' check. Adapt if your logic is different.
    if (!hasCredits("image")) {
      setFormMessage({ type: 'error', text: "No credits left. Please upgrade your plan." })
      // Optionally use toast as well:
      // toast({
      //   title: "No credits",
      //   description: "You don't have enough credits to generate images. Subscribe to a plan to get more credits.",
      //   variant: "destructive",
      // })
      return
    }
    // --- End Credit Check ---

    // Ensure a model is selected and accessible before submitting
    if (!selectedModel || !isModelAccessible(selectedModel.tier)) {
       toast({
         title: "Model Not Accessible",
         description: "Please select a model available for your subscription tier.",
         variant: "destructive",
       })
       // Also set form message for model accessibility
       setFormMessage({ type: 'error', text: "Please select a model available for your subscription tier." })
       return;
    }


    setIsGenerating(true)
    try {
      // Use the entire formState as params
      // This automatically includes any model-specific parameters
      const params: GenerationParams = {
        ...formState,
        model: selectedModel.id,
      }

      // --- Start Generation ---
      const initialResult = await generateImage(params)

      // Check if the initial call itself failed (e.g., Replicate API error on start)
      if (!initialResult || !initialResult.id || (initialResult.status !== 'starting' && initialResult.status !== 'processing')) {
          const startErrorMessage = initialResult?.error || "Failed to start generation process.";
          setFormMessage({ type: 'error', text: startErrorMessage });
          setIsGenerating(false); // Stop loading indicator
          return; // Exit early
      }

      setFormMessage({ type: 'info', text: `Generation started (ID: ${initialResult.id}). Waiting for results...` });

      // --- Polling Logic ---
      const predictionId = initialResult.id;
      let finalResult: GenerationResult | null = null;
      let attempts = 0;
      const maxAttempts = 30; // Poll for ~2.5 minutes (30 * 5 seconds)
      const pollInterval = 5000; // 5 seconds

      // Store the model name from the initial result if available
      if (initialResult.model) {
        // The model name is already in initialResult.model
        console.log("Model name from initial result:", initialResult.model)
      }

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const statusResult = await checkGenerationStatus(predictionId);

          if (statusResult.status === 'succeeded') {
            finalResult = statusResult;
            break; // Exit loop on success
          } else if (statusResult.status === 'failed' || statusResult.status === 'canceled') {
            finalResult = statusResult; // Store failed/canceled result
            break; // Exit loop on failure/cancel
          }
          // If still processing/starting, wait and poll again
          await new Promise(resolve => setTimeout(resolve, pollInterval));

        } catch (pollError: any) {
          // Handle errors during polling (e.g., network issue, 500 from status endpoint)
          setFormMessage({ type: 'error', text: `Error checking status: ${pollError.message}` });
          // Decide if you want to stop polling on error or keep trying
          break; // Stop polling on error for now
        }
      } // End polling loop

      // --- Handle Final Result ---
      setIsGenerating(false); // Stop loading indicator regardless of outcome

      if (finalResult && finalResult.status === 'succeeded' && finalResult.output && finalResult.output.length > 0) {
        // Credit is already deducted in the API, no need to call useCredit here
        // await useCredit("image"); // This was causing double credit deduction
        await addToHistory(finalResult);
        onGenerationComplete(finalResult);
        setFormMessage(null); // Clear info message on success
      } else {
        // Handle failed, canceled, or timed-out polls
        let endErrorMessage = "Image generation failed or timed out.";
        if (finalResult?.status === 'failed') {
            endErrorMessage = `Generation failed: ${finalResult.error || 'Unknown reason'}`;
        } else if (finalResult?.status === 'canceled') {
            endErrorMessage = "Generation canceled.";
        } else if (attempts >= maxAttempts) {
            endErrorMessage = "Generation timed out while waiting for results.";
        }
        setFormMessage({ type: 'error', text: endErrorMessage });
      }

    } catch (error: any) {
       // Catch errors from the *initial* generateImage call (e.g., network error before starting)
       const initialErrorMessage = error.message || "An unexpected error occurred before starting generation.";
       setFormMessage({ type: 'error', text: initialErrorMessage });
       setIsGenerating(false); // Ensure loading stops if initial call fails
    }
    // No finally block needed here as setIsGenerating(false) is handled within outcomes
  }

  return (
    <GlassCard className="w-full">
      <GlassCardHeader>
        <GlassCardTitle>Image Generator</GlassCardTitle>
        <GlassCardDescription>Generate images using AI</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="text-white">Prompt</Label>
            {/* Use TextareaAutosize */}
            <TextareaAutosize
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt"
              required
              className="w-full resize-none bg-black/20 border-white/10 text-white placeholder:text-white/50 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Apply base styles, remove min-h
              minRows={3} // Set initial height equivalent (adjust as needed)
            />
          </div>
          <div>
            <Label htmlFor="negative-prompt" className="text-white">Negative Prompt</Label>
             {/* Use TextareaAutosize */}
            <TextareaAutosize
              id="negative-prompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Enter negative prompt (optional)"
              className="w-full resize-none bg-black/20 border-white/10 text-white placeholder:text-white/50 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Apply base styles, remove min-h
              minRows={2} // Set initial height equivalent (adjust as needed)
            />
          </div>
          {/* Moved Model Selector Here */}
          <div>
            <Label htmlFor="model" className="text-white">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {sortedModels.map((m) => {
                  const accessible = isModelAccessible(m.tier)
                  return (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      disabled={!accessible}
                      className={cn(!accessible && "text-muted-foreground")}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{m.name}</span>
                        {!accessible && <Lock className="h-3 w-3 ml-2" />}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {/* End Moved Model Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width" className="text-white">Width</Label>
              <Input
                type="number"
                id="width"
                value={width}
                onChange={(e) => setWidth(Number.parseInt(e.target.value))}
                min="512"
                max="1536"
                required
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-white">Height</Label>
              <Input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(Number.parseInt(e.target.value))}
                min="512"
                max="1536"
                required
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="num_inference_steps" className="text-white">Number of Inference Steps</Label>
            <Slider
              id="num_inference_steps"
              min={1}
              max={100}
              step={1}
              value={[numInferenceSteps]}
              onValueChange={(value) => setNumInferenceSteps(value[0])}
              className="[&>span]:bg-primary"
            />
          </div>
          <div>
            <Label htmlFor="guidance_scale" className="text-white">Guidance Scale</Label>
            <Slider
              id="guidance_scale"
              min={0}
              max={20}
              step={0.1}
              value={[guidanceScale]}
              onValueChange={(value) => setGuidanceScale(value[0])}
              className="[&>span]:bg-primary"
            />
          </div>
          <div>
            <Label htmlFor="num_images" className="text-white">Number of Images</Label>
            <Input
              type="number"
              id="num_images"
              value={numImages}
              onChange={(e) => setNumImages(Number.parseInt(e.target.value))}
              min="1"
              max="4"
              required
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div>
            <Label htmlFor="scheduler" className="text-white">Scheduler</Label>
            <Select value={scheduler} onValueChange={setScheduler}>
              <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Select a scheduler" />
              </SelectTrigger>
              <SelectContent>
                {modelConfig.schedulers.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="seed" className="text-white">Seed (optional)</Label>
            <Input
              type="number"
              id="seed"
              value={seed || ""}
              onChange={(e) => setSeed(e.target.value === "" ? undefined : Number.parseInt(e.target.value))}
              placeholder="Enter a seed for reproducibility"
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          {/* Model Selector was moved up */}
          <GlassCardFooter className="flex-col items-start"> {/* Use flex-col */}
            <Button type="submit" className="w-full mb-2" disabled={isGenerating || !selectedModel || !isModelAccessible(selectedModel.tier)}> {/* Add margin-bottom */}
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Images"
              )}
            </Button>
            {/* Display Form Message - Updated styling */}
            {formMessage && (
              <div className={`flex items-center text-sm mt-2 p-2 rounded-md ${
                formMessage.type === 'error' ? 'text-red-700 bg-red-100 border border-red-300' :
                formMessage.type === 'success' ? 'text-green-700 bg-green-100 border border-green-300' :
                'text-blue-700 bg-blue-100 border border-blue-300' // Info style
              }`}>
                {formMessage.type === 'error' && <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />}
                {formMessage.type === 'success' && <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0" />}
                {/* Add an icon for info if desired */}
                {formMessage.text}
              </div>
            )}
          </GlassCardFooter>
        </form>
      </GlassCardContent>
    </GlassCard>
  )
}
