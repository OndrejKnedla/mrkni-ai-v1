"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { GenerationResult } from "@/lib/types"
import { Download, Share2, Trash } from "lucide-react"
import { Image } from "@/components/ui/image"
import { useHistory } from "@/context/history-context"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "./ui-overrides"

interface ResultsGalleryProps {
  result: GenerationResult | null
}

export function ResultsGallery({ result }: ResultsGalleryProps) {
  const { removeFromHistory } = useHistory()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!result || !result.output || result.output.length === 0) {
    return (
      <GlassCard className="w-full">
        <GlassCardHeader>
          <GlassCardTitle>Generated Images</GlassCardTitle>
          <GlassCardDescription>Your AI-generated images will appear here</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="flex items-center justify-center py-12">
          <p className="text-gray-300">Generate an image to see results</p>
        </GlassCardContent>
      </GlassCard>
    )
  }

  // Helper to get original URL from proxied URL if needed
  const getOriginalUrl = (url: string): string => {
    if (url.includes('/api/image-proxy?url=')) {
      try {
        const encodedUrl = url.split('/api/image-proxy?url=')[1]
        return decodeURIComponent(atob(encodedUrl))
      } catch (e) {
        console.error('Error decoding URL:', e)
        return url
      }
    }
    return url
  }

  const handleDownload = (url: string | undefined) => {
    if (!url) {
      alert("Image is not available for download")
      return
    }

    try {
      // Always use the original URL for downloads
      const originalUrl = getOriginalUrl(url)

      const a = document.createElement("a")
      a.href = originalUrl
      a.download = `mrkniai-${result.id}-${selectedImageIndex}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Failed to download image")
    }
  }

  const handleShare = async (url: string | undefined) => {
    if (!url) {
      alert("Image is not available for sharing")
      return
    }

    // Always use the original URL for sharing
    const originalUrl = getOriginalUrl(url)

    if (navigator.share) {
      try {
        await navigator.share({
          title: "MrkniAI Generated Image",
          text: "Check out this AI-generated image!",
          url: originalUrl,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      try {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(originalUrl)
        alert("Image URL copied to clipboard!")
      } catch (error) {
        console.error("Error copying to clipboard:", error)
        alert("Failed to copy image URL")
      }
    }
  }

  const handleDelete = () => {
    if (result) {
      removeFromHistory(result.id)
    }
  }

  // Get model name from the full model ID
  const getModelName = (modelId: string) => {
    const parts = modelId.split("/")
    return parts.length > 1 ? parts[1] : modelId
  }

  return (
    <GlassCard className="w-full">
      <GlassCardHeader>
        <GlassCardTitle>Generated Images</GlassCardTitle>
        <GlassCardDescription>Your AI-generated images</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={result.output?.[selectedImageIndex] || ""}
            alt={`Generated image ${selectedImageIndex + 1}`}
            fill
            className="object-cover"
            fallbackSrc="/placeholder/image.svg"
          />
        </div>

        {result.output.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {result.output.map((url, index) => (
              <button
                key={index}
                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                  selectedImageIndex === index ? "border-primary" : "border-transparent"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <Image
                  src={url || ""}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  fallbackSrc="/placeholder/image.svg"
                />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Generation Parameters</h3>
          <div className="text-sm text-gray-300">
            <p>
              <strong>Prompt:</strong> {result.input.prompt}
            </p>
            {result.input.negative_prompt && (
              <p>
                <strong>Negative Prompt:</strong> {result.input.negative_prompt}
              </p>
            )}
            <p>
              <strong>Dimensions:</strong> {result.input.width}x{result.input.height}
            </p>
            <p>
              <strong>Steps:</strong> {result.input.num_inference_steps}
            </p>
            <p>
              <strong>Guidance Scale:</strong> {result.input.guidance_scale}
            </p>
            <p>
              <strong>Scheduler:</strong> {result.input.scheduler}
            </p>
            {result.input.seed && (
              <p>
                <strong>Seed:</strong> {result.input.seed}
              </p>
            )}
            <p>
              <strong>Model:</strong> {result.model || (result.input.model ? getModelName(result.input.model) : "Unknown")}
            </p>
          </div>
        </div>
      </GlassCardContent>
      <GlassCardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleDownload(result.output?.[selectedImageIndex])}
          disabled={!result.output?.[selectedImageIndex]}
          className="border-white/10 bg-black/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare(result.output?.[selectedImageIndex])}
          disabled={!result.output?.[selectedImageIndex]}
          className="border-white/10 bg-black/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          className="border-white/10 bg-black/20 text-white hover:bg-white/10"
        >
          <Trash className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </GlassCardFooter>
    </GlassCard>
  )
}
