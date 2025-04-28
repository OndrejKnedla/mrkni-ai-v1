"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromptAgent } from "@/components/prompt-agent"
import { GeneratorForm } from "@/components/generator-form-new"
import { ResultsGallery } from "@/components/results-gallery"
import { HistoryGallery } from "@/components/history-gallery"
import { useAuth } from "@/context/auth-context"
import type { GenerationResult, HistoryItem } from "@/lib/types"
import { Loader2 } from "lucide-react"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui-overrides"

export default function ImagesPage() {
  const { user, loading } = useAuth()
  // State for tabs in the generator section
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [imageData, setImageData] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("generator")
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  // Handlers for the generator section
  const handlePromptGenerated = (prompt: string, negativePrompt: string, image?: string) => {
    setPrompt(prompt)
    setNegativePrompt(negativePrompt)
    setImageData(image)
    setActiveTab("generator")
  }

  const handleGenerationComplete = (result: GenerationResult) => {
    setGenerationResult(result)
  }

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setGenerationResult(item)
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
        // Redirect to home for login
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-white drop-shadow-md">Please sign in to access this page.</p>
          </div>
        </div>
      ) : (
        // Logged-in view - Image generator
        <div className="container mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">AI Image Generator</h1>
            <p className="text-white/70 mt-2 max-w-2xl mx-auto">
              Generate unique images from text prompts using our AI agents
            </p>
          </div>

          {/* Two-column grid for generator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Column: Tabs */}
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
                      <GlassCardTitle>AI Prompt Assistant</GlassCardTitle>
                      <GlassCardDescription>
                        Let our AI help you craft the perfect prompt
                      </GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <PromptAgent onPromptGenerated={handlePromptGenerated} />
                    </GlassCardContent>
                  </GlassCard>
                </TabsContent>
                <TabsContent value="generator">
                  <GeneratorForm
                    initialPrompt={prompt}
                    initialNegativePrompt={negativePrompt}
                    initialImage={imageData}
                    onGenerationComplete={handleGenerationComplete}
                  />
                </TabsContent>
                <TabsContent value="history">
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>Generation History</GlassCardTitle>
                      <GlassCardDescription>
                        Your previous image generations
                      </GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <HistoryGallery
                        type="image"
                        onSelectItem={handleSelectHistoryItem}
                        limit={9}
                      />
                    </GlassCardContent>
                  </GlassCard>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Results */}
            <div>
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Generated Images</GlassCardTitle>
                  <GlassCardDescription>
                    View your AI-generated images
                  </GlassCardDescription>
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
