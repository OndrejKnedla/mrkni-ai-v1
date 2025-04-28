"use client"

// Removed Metadata type import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { modelConfig, type AIModel } from "@/lib/config" // Import AIModel from config
// Correct the import names and use VideoModel from types
import { videoModels } from "@/lib/replicate/video-models"
import type { VideoModel } from "@/lib/types" // Only import VideoModel from types
import { Check, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import Link from "next/link"

// Define ModelTier type if not globally available
type ModelTier = "premium" | "basic" | "free";

// Removed metadata export as it's not allowed in Client Components
// export const metadata: Metadata = { ... }

export default function AIModelsPage() {
  const [imageModelFilter, setImageModelFilter] = useState<ModelTier | "all">("all")
  // Update videoModelFilter state to include 'free'
  const [videoModelFilter, setVideoModelFilter] = useState<ModelTier | "all">("all")

  // --- Image Model Filtering & Sorting ---
  const allImageModels = modelConfig.models;
  const filteredImageModels =
    imageModelFilter === "all"
      ? allImageModels
      : allImageModels.filter((model) => model.tier === imageModelFilter);

  const tierOrder: Record<ModelTier, number> = { premium: 0, basic: 1, free: 2 };

  const sortedFilteredImageModels = [...filteredImageModels].sort((a, b) => {
      return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // --- Video Model Filtering & Sorting ---
  const allVideoModels = videoModels; // Use the correct variable name
  let filteredVideoModelsResult: VideoModel[] = []; // Use VideoModel type and initialize

  // Updated filtering logic for video models
  if (videoModelFilter === "all") {
    filteredVideoModelsResult = allVideoModels;
  } else {
    // Filter directly by the selected tier ('premium', 'basic', or 'free')
    filteredVideoModelsResult = allVideoModels.filter((model) => model.tier === videoModelFilter);
  }


  const sortedFilteredVideoModels = [...filteredVideoModelsResult].sort((a: VideoModel, b: VideoModel) => { // Add types
      // Use 'basic' as default if tier is missing, since 'free' is removed
      const tierA = a.tier || 'basic';
      const tierB = b.tier || 'basic';
      return tierOrder[tierA] - tierOrder[tierB];
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">AI Models</h1>
        <p className="text-white/70 mt-2 max-w-2xl mx-auto">
          Explore our collection of AI image and video generation models
        </p>
      </div>

      <Tabs defaultValue="image-models" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm">
          <TabsTrigger
            value="image-models"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
          >
            Image Models
          </TabsTrigger>
          <TabsTrigger
            value="video-models"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
          >
            Video Models
          </TabsTrigger>
        </TabsList>

        {/* Image Models Tab */}
        <TabsContent value="image-models">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Available AI Image Models</CardTitle>
              <CardDescription className="text-white/70">
                Explore the different AI models available for image generation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white/90">
              {/* Image Filter Buttons */}
              <div className="flex justify-center space-x-2 mb-6">
                <Badge
                  className={`cursor-pointer ${imageModelFilter === "all" ? "bg-primary" : "bg-white/10"}`}
                  onClick={() => setImageModelFilter("all")}
                >
                  All Models
                </Badge>
                <Badge
                  className={`cursor-pointer ${imageModelFilter === "premium" ? "bg-green-600" : "bg-white/10"}`}
                  onClick={() => setImageModelFilter("premium")}
                >
                  Premium
                </Badge>
                <Badge
                  className={`cursor-pointer ${imageModelFilter === "basic" ? "bg-orange-500" : "bg-white/10"}`}
                  onClick={() => setImageModelFilter("basic")}
                >
                  Basic
                </Badge>
                {/* Add Free Filter Badge for Images */}
                <Badge
                  className={`cursor-pointer ${imageModelFilter === "free" ? "bg-gray-500" : "bg-white/10"}`}
                  onClick={() => setImageModelFilter("free")}
                >
                  Free
                </Badge>
              </div>
              {/* Image Model Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add message if no models match the filter */}
                {sortedFilteredImageModels.length === 0 && imageModelFilter !== "all" && (
                  <p className="text-center text-white/70 md:col-span-2">
                    No models found for the "{imageModelFilter}" tier.
                  </p>
                )}
                {sortedFilteredImageModels.map((model: AIModel) => { // Type already correct here
                  // Extract just the model part for the URL (after the slash)
                  const modelPart = model.id.split('/').pop() || model.id;
                  return (
                    <Link href={`/models/image/${encodeURIComponent(modelPart)}`} key={model.id}>
                      <div className="border border-white/10 rounded-lg p-4 bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium group-hover:text-primary transition-colors">{model.name}</h3>
                          <Badge
                            variant={
                              model.tier === "premium" ? "default" : model.tier === "basic" ? "secondary" : "outline"
                            }
                            className={
                              model.tier === "premium"
                                ? "bg-green-600 text-white" // Premium (green)
                                : model.tier === "basic"
                                  ? "bg-orange-500 text-white" // Basic (orange)
                                  : "bg-gray-500 text-white" // Free (grey)
                            }
                          >
                            {model.tier.charAt(0).toUpperCase() + model.tier.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Provider: {model.provider}</p>
                        <p className="mb-3">{model.description}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Strengths:</p>
                          <ul className="space-y-1">
                            {model.strengths.slice(0, 3).map((strength: string, index: number) => ( // Add types
                              <li key={index} className="flex items-start text-sm">
                                <Check className="h-4 w-4 text-primary shrink-0 mr-2 mt-0.5" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-3 text-sm text-white/70">
                          Max dimension: {model.maxDimension}x{model.maxDimension}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <span className="text-primary text-sm flex items-center group-hover:underline">
                            View details <ArrowRight className="ml-1 h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Models Tab */}
        <TabsContent value="video-models">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Available AI Video Models</CardTitle>
              <CardDescription className="text-white/70">
                Explore the different AI models available for video generation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white/90">
              {/* Video Filter Buttons */}
              <div className="flex justify-center space-x-2 mb-6">
                <Badge
                  className={`cursor-pointer ${videoModelFilter === "all" ? "bg-primary" : "bg-white/10"}`}
                  onClick={() => setVideoModelFilter("all")}
                >
                  All Models
                </Badge>
                <Badge
                  className={`cursor-pointer ${videoModelFilter === "premium" ? "bg-green-600" : "bg-white/10"}`}
                  onClick={() => setVideoModelFilter("premium")}
                >
                  Premium
                </Badge>
                <Badge
                  className={`cursor-pointer ${videoModelFilter === "basic" ? "bg-orange-500" : "bg-white/10"}`}
                  onClick={() => setVideoModelFilter("basic")}
                >
                  Basic
                </Badge>
                {/* Add Free Filter Badge */}
                <Badge
                  className={`cursor-pointer ${videoModelFilter === "free" ? "bg-gray-500" : "bg-white/10"}`}
                  onClick={() => setVideoModelFilter("free")}
                >
                  Free
                </Badge>
              </div>
              {/* Video Model Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedFilteredVideoModels.length === 0 && videoModelFilter !== "all" && (
                  <p className="text-center text-white/70 md:col-span-2">
                    No models found for the "{videoModelFilter}" tier.
                  </p>
                )}
                {sortedFilteredVideoModels.map((model: VideoModel) => { // Use correct type VideoModel
                  // Extract just the model part for the URL (after the slash)
                  const modelPart = model.id.split('/').pop() || model.id;
                  return (
                    <Link href={`/models/video/${encodeURIComponent(modelPart)}`} key={model.id}>
                      <div className="border border-white/10 rounded-lg p-4 bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium group-hover:text-primary transition-colors">{model.name}</h3>
                          <Badge
                            variant={
                              model.tier === "premium" ? "default" : model.tier === "basic" ? "secondary" : "outline"
                            }
                            className={
                              model.tier === "premium"
                                ? "bg-green-600 text-white" // Premium (green)
                                : model.tier === "basic"
                                  ? "bg-orange-500 text-white" // Basic (orange)
                                  : "bg-gray-500 text-white" // Free (grey)
                            }
                          >
                            {/* Safely access tier */}
                            {(model.tier || 'basic').charAt(0).toUpperCase() + (model.tier || 'basic').slice(1)}
                          </Badge>
                        </div>
                        {/* <p className="text-sm text-white/70 mb-2">Provider: {model.provider}</p>  <- Remove: Provider doesn't exist on VideoModel */}
                        <p className="mb-3">{model.description}</p>
                        {/* Remove Strengths section as it doesn't exist on VideoModel */}
                        {/*
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Strengths:</p>
                          <ul className="space-y-1">
                            {(model.strengths as string[] || []).slice(0, 3).map((strength: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <Check className="h-4 w-4 text-primary shrink-0 mr-2 mt-0.5" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        */}
                        <div className="mt-3 text-sm text-white/70">
                          Max resolution: {model.maxResolution} • Max duration: {model.maxDuration}s
                        </div>
                        <div className="mt-3 flex justify-end">
                          <span className="text-primary text-sm flex items-center group-hover:underline">
                            View details <ArrowRight className="ml-1 h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
