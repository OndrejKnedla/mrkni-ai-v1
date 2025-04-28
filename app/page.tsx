"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromptAgent } from "@/components/prompt-agent"
import { GeneratorForm } from "@/components/generator-form-new"
import { ResultsGallery } from "@/components/results-gallery"
import { HistoryGallery } from "@/components/history-gallery"
import { GoogleSignIn } from "@/components/auth/google-sign-in"
import { useAuth } from "@/context/auth-context"
import type { GenerationResult, HistoryItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ImageIcon, Loader2, Sparkles } from "lucide-react"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui-overrides"
import { siteConfig } from '@/lib/config'

export default function Home() {
  const { user, loading } = useAuth()
  // Restore state for tabs and prompt agent
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [imageData, setImageData] = useState<string | undefined>(undefined) // Add state for image data
  const [activeTab, setActiveTab] = useState("generator")
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  // Restore handlers
  // Update handler to accept and set image data
  const handlePromptGenerated = (prompt: string, negativePrompt: string, image?: string) => {
    setPrompt(prompt)
    setNegativePrompt(negativePrompt)
    setImageData(image) // Set the image data state
    setActiveTab("generator")
  }

  const handleGenerationComplete = (result: GenerationResult) => {
    setGenerationResult(result)
    // Optionally switch to results tab, or keep it separate
    // setActiveTab("results") // Keep results in its own column for now
  }

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setGenerationResult(item)
    // Optionally switch to results tab
    // setActiveTab("results")
  }

  return (
    <>
      {loading ? (
        // Loading state
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-white drop-shadow-md">Loading...</p>
          </div>
        </div>
      ) : !user ? (
        // Sign-in prompt
        <div className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[80vh] justify-center">
          <div className="max-w-md w-full mx-auto mb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-block p-4 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                <Sparkles className="h-16 w-16 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">MrkniAI</h1>
            <p className="text-xl text-white/80 mb-8 drop-shadow-md">
              Create stunning AI-generated images and videos with just a few clicks
            </p>
            <div className="space-y-6">
              <GoogleSignIn />
              <div className="text-white/60 text-sm">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Logged-in view - Apply new structure
        <div className="container mx-auto px-4 py-8">
          {/* Title Section - similar to video page */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">AI Image Generator</h1>
            <p className="text-white/70 mt-2 max-w-2xl mx-auto">
              Generate unique images from text prompts using various AI models.
            </p>
          </div>

          {/* Gallery Button Removed From Here */}

          {/* Two-column grid - similar to video page */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Column: Reintroduce Tabs */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-sm mb-4">
                  <TabsTrigger
                    value="prompt"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
                  >
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger
                    value="generator"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
                  >
                    Generator
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="prompt">
                  {/* Wrap PromptAgent in GlassCard for consistency */}
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>Prompt Agent</GlassCardTitle>
                      <GlassCardDescription>Generate creative prompts or upload an image</GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <PromptAgent onPromptGenerated={handlePromptGenerated} />
                    </GlassCardContent>
                  </GlassCard>
                </TabsContent>
                <TabsContent value="generator">
                  {/* GeneratorForm is already a GlassCard */}
                  <GeneratorForm
                    initialPrompt={prompt}
                    initialNegativePrompt={negativePrompt}
                    initialImage={imageData}
                    onGenerationComplete={handleGenerationComplete}
                  />
                </TabsContent>
                <TabsContent value="history">
                   {/* Wrap HistoryGallery in GlassCard */}
                   <GlassCard>
                     <GlassCardHeader>
                       <GlassCardTitle>History</GlassCardTitle>
                       <GlassCardDescription>Your past generations</GlassCardDescription>
                     </GlassCardHeader>
                     <GlassCardContent>
                       <HistoryGallery onSelectItem={handleSelectHistoryItem} />
                     </GlassCardContent>
                   </GlassCard>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Results */}
            <div>
              <GlassCard className="w-full">
                 <GlassCardHeader className="flex flex-row items-center justify-between space-y-0"> {/* Use flex to position title and button */}
                   <div> {/* Wrap title/desc */}
                     <GlassCardTitle>Generated Images</GlassCardTitle>
                     <GlassCardDescription>Your AI-generated images will appear here</GlassCardDescription>
                   </div>
                   {/* Add Gallery Button Here */}
                   <Link href="/gallery">
                     <Button
                       variant="outline"
                       className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                     >
                       <ImageIcon className="h-4 w-4" />
                       View Gallery
                     </Button>
                   </Link>
                 </GlassCardHeader>
                 <GlassCardContent>
                    <ResultsGallery result={generationResult} />
                 </GlassCardContent>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
