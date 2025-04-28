"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react" // Added useMemo
// Removed Metadata type import
import Link from "next/link"
import {
  Loader2,
  Download,
  Share2,
  Lock,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Video as VideoIcon,
  FileText,
  Image as ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Import Select component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Import createClient function instead of the instance
import { createClient } from "@/lib/supabase/client";
// ScrollArea is used in VideoHistoryGallery component
import { useAuth } from "@/context/auth-context";
import { useSubscription } from "@/context/subscription-context";
import { useHistory } from "@/context/history-context";
// Removed PromptAgent import
import { VideoHistoryGallery } from "@/components/video-history-gallery"
// Removed VideoModelStatus import
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui-overrides"
// Use defaultVideoModel directly as there's only one
import { defaultVideoModel } from "@/lib/replicate/video-models"
// Removed checkGenerationStatus import, will use fetch directly
// Removed cn import as model selection styling is gone
// Removed ModelTier import
import type { GenerationParams, HistoryItem, VideoModel } from "@/lib/types"; // Import VideoModel

// Removed metadata export as it's not allowed in Client Components
// export const metadata: Metadata = { ... }

// Define types for video generation parameters based on Luma model
interface VideoGenerationParams {
  prompt: string;
  negative_prompt?: string;
  start_image_url?: string; // New field for Luma
  end_image_url?: string; // New field for Luma
  seed?: number;
  guidance_scale?: number; // Luma uses this
  aspect_ratio?: string; // Add aspect ratio
  // Removed width, height, num_frames, fps, num_inference_steps, image (replaced by URLs)
}

interface VideoGenerationResult {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  input: VideoGenerationParams // Use the updated interface here
  output: string | string[] | null // Output can be a single URL or array
  error?: string
  created_at: string
  model?: string // Model ID used
  version?: string // Model version used
}

// Helper to convert base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })

export default function VideoPage() {
  // Remove session from useAuth destructuring
  const { user, loading: authLoading } = useAuth();
  const { subscription, hasCredits } = useSubscription();
  // Get the Supabase client instance using the function
  const supabase = useMemo(() => createClient(), []);
  const { addToHistory } = useHistory();

  // Use the single default model directly
  const selectedModel: VideoModel = defaultVideoModel;

  // Initialize formState with defaults from the Luma model
  const [formState, setFormState] = useState<VideoGenerationParams & { aspect_ratio?: string }>({ // Add aspect_ratio to state type
    prompt: "",
    negative_prompt: selectedModel.defaultNegativePrompt || "",
    start_image_url: "", // Initialize new fields
    end_image_url: "",   // Initialize new fields
    seed: undefined,
    guidance_scale: selectedModel.default_params?.guidance_scale || 7.5,
    aspect_ratio: "16:9", // Default aspect ratio
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<VideoGenerationResult | null>(null)
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  // Removed uploadedImagePreview state

  // --- Form State Management --- (Simplified)
  const updateFormField = (field: keyof (VideoGenerationParams & { aspect_ratio?: string }), value: string | number | undefined | null) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Handler specifically for Select component changes
  const handleSelectChange = (field: keyof (VideoGenerationParams & { aspect_ratio?: string }), value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Removed useEffect for model/mode changes
  // Removed image upload handling (using URLs now)
  // Removed model availability check logic

  // --- Form Submission (Simplified for Luma) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setResult(null); // Clear previous result

    // Basic validation
    if (!formState.prompt?.trim()) {
      setFormMessage({ type: "error", text: "Prompt cannot be empty." });
      return;
    }

    // Check credits
    if (!hasCredits("video")) {
      setFormMessage({ type: "error", text: "No video credits left. Please upgrade your plan." });
      return;
    }

    setIsGenerating(true);
    try {
      // Construct parameters specifically for the Luma model API call
      const apiParams: Record<string, any> = {
        modelId: selectedModel.id,
        version: selectedModel.version,
        prompt: formState.prompt,
        duration: 5, // Use updated fixed duration
        aspect_ratio: formState.aspect_ratio || "16:9", // Use selected aspect ratio
      };

      // Add optional parameters if provided
      if (formState.negative_prompt) {
        apiParams.negative_prompt = formState.negative_prompt;
      }
      if (formState.start_image_url) {
        apiParams.start_image_url = formState.start_image_url;
      }
      if (formState.end_image_url) {
        apiParams.end_image_url = formState.end_image_url;
      }
      if (formState.seed) {
        apiParams.seed = formState.seed;
      }
      if (formState.guidance_scale) {
        apiParams.guidance_scale = formState.guidance_scale;
      }

      console.log(`Using model: ${selectedModel.name} (${selectedModel.id}), version: ${selectedModel.version}`);
      console.log("API Params:", apiParams); // Log params being sent

      // --- Start Generation API Call ---
      // Get current session/token before making the call
      // Ensure supabase client is available
      if (!supabase) {
        console.error("Supabase client not available in handleSubmit");
        setFormMessage({ type: "error", text: "Initialization error. Please try again." });
        setIsGenerating(false);
        return;
      }
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession) {
          console.error("Session Error:", sessionError);
          setFormMessage({ type: "error", text: "Could not retrieve authentication session. Please sign in again." });
          setIsGenerating(false);
          return;
      }
      const accessToken = currentSession.access_token;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`, // Use the retrieved token
      };

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(apiParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Data:', errorData); // Log the full error data
        // Use the error message from the backend response directly, or fallback
        const backendErrorMessage = errorData?.error || errorData?.message || errorData?.detail || errorData?.title || `API Error: ${response.statusText}`;
        throw new Error(backendErrorMessage);
      }

      const initialResult = await response.json();

      if (!initialResult || !initialResult.id || (initialResult.status !== "starting" && initialResult.status !== "processing")) {
        throw new Error(initialResult?.error || "Failed to start generation process.");
      }

      setFormMessage({ type: "info", text: `Generation started (ID: ${initialResult.id}). Waiting for results...` });

      // --- Polling Logic --- (No changes needed here)
      const predictionId = initialResult.id;
      let finalResult: VideoGenerationResult | null = null;
      let attempts = 0;
      const maxAttempts = 60; // Poll for ~5 minutes (60 * 5 seconds)
      const pollInterval = 5000; // 5 seconds

      while (attempts < maxAttempts) {
        attempts++;
        let statusResult = null;
        try {
          // Poll the new video status endpoint
          const statusResponse = await fetch(`/api/video-status?id=${predictionId}`);
          if (!statusResponse.ok) {
            // Handle non-OK responses during polling if needed, e.g., log and continue/break
            console.error(`Polling status check failed: ${statusResponse.status}`);
            // Optionally break or add more robust error handling
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue; // Try polling again after delay
          }
          statusResult = await statusResponse.json();

          console.log(`Poll attempt ${attempts} for video ${predictionId}: ${statusResult.status}`);

          if (statusResult.status === "succeeded") {
            finalResult = { ...statusResult, input: formState }; // Combine Replicate result with form input
            break; // Exit loop on success
          } else if (statusResult.status === "failed" || statusResult.status === "canceled") {
            finalResult = { ...statusResult, input: formState };
            break; // Exit loop on failure/cancellation
          }

          // Wait before the next poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval));

        } catch (pollError: any) {
          console.error("Polling error:", pollError);
          setFormMessage({ type: "error", text: `Error checking video status: ${pollError.message}` });
          // Decide whether to break or continue polling on specific errors
          break; // Stop polling on fetch/parse error
        }
      } // End polling loop


      // --- Handle Final Result ---
      setIsGenerating(false);

      if (finalResult && finalResult.status === "succeeded" && finalResult.output) {
        // IMPORTANT: Update the result state with the final data from polling
        setResult(finalResult);

        // Prepare data for history context
        // Ensure the structure matches GenerationParams expected by HistoryItem
        const historyInput: GenerationParams = {
          prompt: finalResult.input.prompt,
          negative_prompt: finalResult.input.negative_prompt,
          // Map relevant params, providing defaults if necessary
          // Width/Height are not directly set, determined by aspect ratio
          width: 0, // Placeholder, not used directly
          height: 0, // Placeholder, not used directly
          num_inference_steps: 0, // Not applicable for Luma in this context
          guidance_scale: finalResult.input.guidance_scale ?? 7.5,
          num_images: 1, // Video results in one output item
          aspect_ratio: formState.aspect_ratio || "16:9", // Include aspect ratio from form state
          scheduler: "", // Not applicable
          seed: finalResult.input.seed,
          model: selectedModel.id, // Use the correct model ID
          image: undefined, // No base64 image for video history
          // Add start/end image URLs if you want them in history (optional)
          // start_image_url: finalResult.input.start_image_url,
          // end_image_url: finalResult.input.end_image_url,
        };
        // Ensure output is string[] | null
        const historyOutput = finalResult.output ? (Array.isArray(finalResult.output) ? finalResult.output : [finalResult.output]) : null;

        // Add the *final* result to history, specifying the type
        try {
            // Pass the item and the type 'video' as separate arguments
            await addToHistory({
                id: finalResult.id,
                // type: 'video', // Type is now passed as second argument
                status: finalResult.status,
                input: historyInput,
                output: historyOutput,
                created_at: finalResult.created_at || new Date().toISOString(),
                model: selectedModel.id, // Use the model ID
            }, 'video'); // Pass 'video' as the second argument
             setFormMessage(null); // Clear info message on success
        } catch (historyError) {
            console.error("Failed to save to history:", historyError);
            // Optionally inform the user history saving failed
        }

      } else {
        let endErrorMessage = "Video generation failed or timed out.";
        if (finalResult?.status === "failed") {
          // Use the error message from the final polled result if available
          endErrorMessage = `Generation failed: ${finalResult.error || "Unknown reason"}`;
        } else if (finalResult?.status === "canceled") {
          endErrorMessage = "Generation canceled.";
        } else if (attempts >= maxAttempts && !finalResult) { // Check if timed out *without* a final result
          endErrorMessage = "Generation timed out while waiting for results.";
        }
        setFormMessage({ type: "error", text: endErrorMessage });
        setResult(finalResult); // Show failed result info if available
      }
    } catch (error: any) {
      console.error("Generation submission error:", error); // Log the error
      setFormMessage({ type: "error", text: error.message || "An unexpected error occurred." });
      setIsGenerating(false);
    }
  };


  // --- Auth Loading / No User States --- (No changes needed here)
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[60vh] justify-center">
        <GlassCard className="w-full max-w-md">
          <GlassCardHeader>
            <GlassCardTitle className="text-white">Authentication Required</GlassCardTitle>
            <GlassCardDescription className="text-white/70">Please sign in to generate videos</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="flex justify-center">
            <Link href="/"><Button>Go to Sign In</Button></Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // --- Main Page Render (Simplified) ---

  // Simplified history select handler (adjust based on actual history item structure)
  const handleHistorySelect = (item: HistoryItem) => {
    // Update form state based on the selected history item
    setFormState({
      prompt: item.input.prompt,
      negative_prompt: item.input.negative_prompt || selectedModel.defaultNegativePrompt || "",
      // Assuming start/end image URLs are not stored directly in history input
      start_image_url: "",
      end_image_url: "",
      seed: item.input.seed,
      guidance_scale: item.input.guidance_scale || selectedModel.default_params?.guidance_scale || 7.5,
      aspect_ratio: item.input.aspect_ratio || "16:9", // Restore aspect ratio
    });
    // No need to update model ID
    // Clear previous results/previews
    setResult(null);
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">AI Video Generator</h1>
        <p className="text-white/70 mt-2 max-w-2xl mx-auto">
          {/* Updated description */}
          Create stunning 5-second videos using the Luma Ray Flash model.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Left Column: Generator Form */}
        <div>
          {/* Removed Tabs wrapper, directly showing the generator */}
          <GlassCard className="w-full">
            <GlassCardHeader>
              <GlassCardTitle>Video Generator ({selectedModel.name})</GlassCardTitle>
              <GlassCardDescription>
                {/* Display credits */}
                You have {subscription?.videoCredits ?? 0} video credits remaining. Duration: 5s.
              </GlassCardDescription>
            </GlassCardHeader>
            <form onSubmit={handleSubmit}>
              <GlassCardContent className="space-y-4">
                {/* Removed Generation Mode Selector */}
                {/* Removed Model Selector */}

                {/* Prompt Input */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the video you want to create..."
                    value={formState.prompt || ""}
                    onChange={(e) => updateFormField("prompt", e.target.value)}
                    className="min-h-[80px] bg-black/20 border-white/10 text-white"
                    required // Prompt is always required
                  />
                </div>

                {/* Negative Prompt */}
                {selectedModel.supportsNegativePrompt && (
                  <div className="space-y-2">
                    <Label htmlFor="negative_prompt" className="text-white">Negative Prompt</Label>
                    <Textarea
                      id="negative_prompt"
                      placeholder="Describe what to avoid (optional)..."
                      value={formState.negative_prompt || ""}
                      onChange={(e) => updateFormField("negative_prompt", e.target.value)}
                      className="min-h-[60px] bg-black/20 border-white/10 text-white"
                    />
                  </div>
                )}

                {/* Aspect Ratio Selector */}
                <div className="space-y-2">
                  <Label htmlFor="aspect_ratio" className="text-white">Aspect Ratio</Label>
                  <Select
                    value={formState.aspect_ratio}
                    onValueChange={(value) => handleSelectChange("aspect_ratio", value)}
                  >
                    <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/90 border-white/20 text-white backdrop-blur">
                      {/* Add options based on the image provided */}
                      <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      <SelectItem value="9:21">9:21</SelectItem>
                      <SelectItem value="21:9">21:9 (Cinematic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Image URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="start_image_url" className="text-white">Start Image URL (Optional)</Label>
                  <Input
                    id="start_image_url" type="url" placeholder="https://..."
                    value={formState.start_image_url || ""}
                    onChange={(e) => updateFormField("start_image_url", e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                {/* End Image URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="end_image_url" className="text-white">End Image URL (Optional)</Label>
                  <Input
                    id="end_image_url" type="url" placeholder="https://..."
                    value={formState.end_image_url || ""}
                    onChange={(e) => updateFormField("end_image_url", e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                {/* Removed Width/Height Inputs */}
                {/* Removed Duration Slider */}
                {/* Removed FPS Slider */}

                {/* Guidance Scale Slider */}
                {selectedModel.supportsGuidanceScale && (
                  <div className="space-y-2">
                    <Label htmlFor="guidance_scale" className="text-white">
                      Guidance Scale: {formState.guidance_scale?.toFixed(1)}
                    </Label>
                    <Slider
                      id="guidance_scale"
                      min={0} max={20} step={0.5}
                      value={[formState.guidance_scale ?? 7.5]} // Use default from state
                      onValueChange={(value) => updateFormField("guidance_scale", value[0])}
                      className="[&>span]:bg-primary"
                    />
                  </div>
                )}

                {/* Removed Steps Slider */}

                {/* Seed Input */}
                {selectedModel.supportsSeed && (
                  <div className="space-y-2">
                    <Label htmlFor="seed" className="text-white">Seed (Optional)</Label>
                    <Input
                      id="seed" type="number" placeholder="Random if empty"
                      value={formState.seed || ""}
                      onChange={(e) => updateFormField("seed", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="bg-black/20 border-white/10 text-white"
                    />
                  </div>
                )}

                {/* Credit Warning */}
                {!hasCredits("video") && (
                  <div className="!mt-6 bg-amber-900/30 border border-amber-500/30 rounded-md p-3 text-amber-200 text-sm">
                    You have no video credits left.{" "}
                    <Link href="/subscription" className="underline font-medium">Upgrade your plan?</Link>
                  </div>
                )}

              </GlassCardContent>
              <GlassCardFooter className="flex-col items-start">
                 {/* Form Message Display */}
                 {formMessage && (
                  <div className={`w-full flex items-center text-sm p-3 rounded-md mb-3 ${
                    formMessage.type === 'error' ? 'text-red-400 bg-red-900/30 border border-red-500/30' :
                    formMessage.type === 'success' ? 'text-green-400 bg-green-900/30 border border-green-500/30' :
                    'text-blue-400 bg-blue-900/30 border border-blue-500/30' // Info style
                  }`}>
                    {formMessage.type === 'error' && <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />}
                    {formMessage.type === 'success' && <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0" />}
                    {formMessage.text}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  // Simplified disabled check
                  disabled={isGenerating || !hasCredits("video")}
                >
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    "Generate Video"
                  )}
                </Button>
              </GlassCardFooter>
            </form>
          </GlassCard>
          {/* Removed other TabsContent */}
        </div>

        {/* Right Column: Results (No major changes needed here, but check param display) */}
        <div>
          <GlassCard className="w-full">
             <GlassCardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <GlassCardTitle>Generated Video</GlassCardTitle>
                <GlassCardDescription>Your AI-generated video will appear here</GlassCardDescription>
              </div>
              {/* Add Gallery Button Here */}
              <Link href="/gallery">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <VideoIcon className="h-4 w-4" />
                  View Gallery
                </Button>
              </Link>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {isGenerating && !result && (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-white/70">Generating video, this may take a minute...</p>
                 </div>
              )}
              {result?.status === 'succeeded' && result.output ? (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40">
                    {/* Handle potential array output from Replicate */}
                    <video
                      key={Array.isArray(result.output) ? result.output[0] : result.output} // Add key for React updates
                      src={Array.isArray(result.output) ? result.output[0] : result.output}
                      controls
                      playsInline
                      muted
                      className="w-full h-full object-contain" // Use object-contain
                      onError={(e) => console.error("Result Video Error:", (e.target as HTMLVideoElement).error)}
                    />
                  </div>
                  {/* Optional: Display generation parameters */}
                   <div className="text-xs text-gray-400 space-y-1 bg-black/20 p-3 rounded-md">
                      {/* Update displayed params */}
                      <p><strong>Model:</strong> {selectedModel.name}</p>
                      <p><strong>Prompt:</strong> {result.input.prompt}</p>
                      {result.input.negative_prompt && <p><strong>Negative:</strong> {result.input.negative_prompt}</p>}
                      {result.input.start_image_url && <p><strong>Start Image:</strong> {result.input.start_image_url}</p>}
                      {result.input.end_image_url && <p><strong>End Image:</strong> {result.input.end_image_url}</p>}
                      <p><strong>Duration:</strong> 5s</p>
                      {/* Display the actual aspect ratio used */}
                      <p><strong>Aspect Ratio:</strong> {result.input.aspect_ratio || '16:9'}</p>
                      {result.input.seed && <p><strong>Seed:</strong> {result.input.seed}</p>}
                   </div>
                </div>
              ) : (
                 !isGenerating && ( // Only show placeholder if not loading
                    <div className="flex items-center justify-center py-12">
                      <p className="text-gray-400">Generate a video to see results</p>
                    </div>
                 )
              )}
               {result?.status === 'failed' && (
                 <div className="text-red-400 text-sm bg-red-900/30 border border-red-500/30 p-3 rounded-md">
                    <p className="font-medium mb-1">Generation Failed</p>
                    <p>{result.error || "An unknown error occurred during generation."}</p>
                 </div>
               )}
            </GlassCardContent>
            {result?.status === 'succeeded' && result.output && (
              <GlassCardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const url = Array.isArray(result.output) ? result.output[0] : result.output
                    if (!url) return;
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `mrkniai-video-${result.id}.mp4` // Assuming mp4
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                  onClick={() => {
                     const url = Array.isArray(result.output) ? result.output[0] : result.output
                     if (!url) return;
                    if (navigator.share) {
                      navigator.share({ title: "MrkniAI Generated Video", url }).catch(console.error)
                    } else {
                      navigator.clipboard.writeText(url)
                      alert("Video URL copied to clipboard!") // Simple fallback
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share</span>
                </Button>
              </GlassCardFooter>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
