"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { videoModels } from "@/lib/replicate/video-models" // Renamed import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft, ExternalLink, Play } from "lucide-react"
import Link from "next/link"
import { Image } from "@/components/ui/image"

export default function VideoModelPage() {
  const params = useParams()
  const modelId = decodeURIComponent(params.id as string)
  const [model, setModel] = useState<(typeof videoModels)[0] | null>(null) // Renamed variable
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState<number | null>(null)

  useEffect(() => {
    // First try to find the model by exact ID match
    let foundModel = videoModels.find((m) => m.id === modelId) // Renamed variable

    // If not found and the ID doesn't contain a slash, try to find by the model part only
    if (!foundModel && !modelId.includes('/')) {
      foundModel = videoModels.find((m) => { // Renamed variable
        // Extract the model part after the slash
        const modelPart = m.id.split('/').pop() || ''
        // Try different matching strategies
        return (
          modelPart === modelId ||
          modelPart.replace(/-/g, '') === modelId.replace(/-/g, '') ||
          modelPart.toLowerCase() === modelId.toLowerCase() ||
          // Handle provider prefix variations
          m.id === `google/${modelId}` ||
          m.id === `luma-ai/${modelId}` ||
          m.id === `luma/${modelId}`
        )
      })
    }

    setModel(foundModel || null)
    setLoading(false)
  }, [modelId])

  // Reset playing video when model changes
  useEffect(() => {
    setPlayingVideo(null)
  }, [model])

  // Handle video playback when playingVideo changes
  useEffect(() => {
    // Pause all videos first
    const allVideos = document.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
    allVideos.forEach(video => {
      try {
        // Check if video is playing by checking if it's not paused and not ended
        if (!video.paused && !video.ended) {
          video.pause();
        }
      } catch (err) {
        console.error('Error pausing video:', err);
      }
    });

    // Then play the selected video
    if (playingVideo !== null) {
      const videoElement = document.querySelector(`[data-video-index="${playingVideo}"]`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.play().catch(err => console.error('Error playing video:', err));
      }
    }
  }, [playingVideo])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-white">Loading model information...</p>
        </div>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Model Not Found</h1>
          <p className="text-white/70 mb-6">The model you're looking for doesn't exist or is not available.</p>
          <Link href="/ai-models?tab=video-models">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Models
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // We'll use local videos from the videos-ai folder

  // Map model IDs to folder names for videos
  const getModelFolder = (id: string) => {
    // Extract the model name part (after the slash)
    const modelPart = id.split('/').pop() || id

    // Special cases for video models
    if (id === 'stability-ai/stable-video-diffusion') {
      return 'stable-video-diffusion'
    }
    if (id === 'pika-labs/pika-1.0') {
      return 'pika-1.0'
    }
    if (id === 'cjwbw/videocrafter-v1.0') {
      return 'videocrafter-v1.0'
    }
    if (id === 'cjwbw/zeroscope-v2-xl') {
      return 'zeroscope-v2-xl'
    }
    if (id === 'lucataco/animov') {
      return 'animov'
    }
    if (id === 'damo-vilab/modelscope-text-to-video-synthesis') {
      return 'modelscope-text-to-video-synthesis'
    }
    if (id === 'google/veo-2') {
      return 'veo-2'
    }
    if (id === 'luma-ai/ray') {
      return 'ray'
    }
    if (id === 'luma-ai/ray-2-540p') {
      return 'ray-2-540p'
    }
    if (id === 'luma-ai/ray-2-720p') {
      return 'ray-2-720p'
    }
    if (id === 'luma-ai/ray-flash-2-540p') {
      return 'ray-flash-2-540p'
    }
    if (id === 'luma-ai/ray-flash-2-720p') {
      return 'ray-flash-2-720p'
    }
    if (id === 'wandiscompany/wan-2.1-t2v-480p') {
      return 'wan-2.1-t2v-480p'
    }
    if (id === 'wandiscompany/wan-2.1-t2v-720p') {
      return 'wan-2.1-t2v-720p'
    }
    if (id === 'wandiscompany/wan-2.1-i2v-480p') {
      return 'wan-2.1-i2v-480p'
    }
    if (id === 'wandiscompany/wan-2.1-i2v-720p') {
      return 'wan-2.1-i2v-720p'
    }
    if (id === 'wandiscompany/wan-2.1-1.3b') {
      return 'wan-2.1-1.3b'
    }
    if (id === 'minimax/video-01') {
      return 'video-01'
    }
    if (id === 'minimax/video-01-director') {
      return 'video-01-director'
    }
    if (id === 'minimax/video-01-live') {
      return 'video-01-live'
    }

    // For other models, just use the model part
    return modelPart
  }

  // Determine the correct file extension for each model
  const getFileExtension = (modelId: string) => {
    const modelPart = modelId.split('/').pop() || modelId

    // Models that use JPG
    if (modelPart === 'photon' || modelPart === 'photon-flash') {
      return 'jpg'
    }
    // Models that use PNG
    if (modelPart === 'imagen-3' || modelPart === 'imagen-3-fast') {
      return 'png'
    }
    // Default to webp for most models
    return 'webp'
  }

  // Get the model folder name for videos
  const modelFolder = getModelFolder(model.id)

  // Construct dynamic paths for the first two videos in the model's folder
  // Assuming videos are named 1.mp4, 2.mp4 etc.
  const videoPath1 = `/videos/videos-ai/${modelFolder}/1.mp4`;
  const videoPath2 = `/videos/videos-ai/${modelFolder}/2.mp4`;

  // Example prompts for this model
  const examplePrompts = [
    model.examplePrompt || "A red fox running through a snowy forest, cinematic lighting",
    "A timelapse of a blooming flower, close-up shot",
    "A drone shot flying over a mountain landscape",
    "A person walking on a beach at sunset, waves crashing",
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/ai-models?tab=video-models"
          className="inline-flex items-center text-white/70 hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Video Models
        </Link>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-white">{model.name}</CardTitle>
                <CardDescription className="text-white/70">
                  Provider: {model.provider} • ID: {model.id}
                </CardDescription>
              </div>
              <Badge
                variant={(model.tier || 'free') === "premium" ? "default" : (model.tier || 'free') === "basic" ? "secondary" : "outline"} // Added fallback
                className={
                  (model.tier || 'free') === "premium" // Added fallback
                    ? "bg-green-600 text-white" // Premium (green)
                    : (model.tier || 'free') === "basic" // Added fallback
                      ? "bg-orange-500 text-white" // Basic (orange)
                      : "bg-gray-500 text-white" // Free (grey)
                }
              >
                {(model.tier || 'free').charAt(0).toUpperCase() + (model.tier || 'free').slice(1)} Tier {/* Added fallback */}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-white/90">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Description</h3>
              <p>{model.description}</p>
            </div>

            {model.strengths && model.strengths.length > 0 && ( // Add check for strengths
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Key Strengths</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {model.strengths.map((strength: string, index: number) => ( // Add types
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-md">
                  <p className="mb-1">
                    <strong>Maximum Resolution:</strong> {model.maxResolution}
                  </p>
                  <p className="mb-1">
                    <strong>Maximum Duration:</strong> {model.maxDuration} seconds
                  </p>
                  <p className="mb-1">
                    <strong>Default FPS:</strong> {model.defaultFPS}
                  </p>
                  <p>
                    <strong>Default Duration:</strong> {model.defaultDuration} seconds
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-md">
                  <p className="mb-1">
                    <strong>Supports Text-to-Video:</strong> {model.supportsTextToVideo ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Supports Image-to-Video:</strong> {model.supportsImageToVideo ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Supports Negative Prompt:</strong> {model.supportsNegativePrompt ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Supports Seed:</strong> {model.supportsSeed ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Output Format:</strong> {(model.outputFormat || 'MP4').toUpperCase()} {/* Added fallback */}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Example Prompts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examplePrompts.map((prompt, index) => (
                  <div key={index} className="bg-black/20 p-3 rounded-md">
                    <p className="italic">"{prompt}"</p>
                  </div>
                ))}
              </div>
            </div>

            {model.defaultNegativePrompt && (
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Recommended Negative Prompt</h3>
                <div className="bg-black/20 p-4 rounded-md">
                  <p className="italic">"{model.defaultNegativePrompt}"</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-white mb-4">Example Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First video */}
                <div className="relative aspect-video rounded-md overflow-hidden bg-black/40">
                  <video
                    key={videoPath1} // Add key
                    src={videoPath1}
                    className="w-full h-full object-cover"
                    controls // Always show controls
                    onClick={() => setPlayingVideo(playingVideo === 0 ? null : 0)}
                    data-video-index="0"
                    preload="auto" // Change preload
                    playsInline
                    muted // Add muted
                    onError={(e) => console.error('Video Error (1):', (e.target as HTMLVideoElement).error)} // Fix error handler type
                  />
                  {playingVideo !== 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={() => setPlayingVideo(playingVideo === 0 ? null : 0)}>
                      <Button variant="outline" size="icon" className="rounded-full bg-black/50 border-white/20">
                        <Play className="h-6 w-6 text-white" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Second video */}
                <div className="relative aspect-video rounded-md overflow-hidden bg-black/40">
                  <video
                    key={videoPath2} // Add key
                    src={videoPath2}
                    className="w-full h-full object-cover"
                    controls // Always show controls
                    onClick={() => setPlayingVideo(playingVideo === 1 ? null : 1)}
                    data-video-index="1"
                    preload="auto" // Change preload
                    playsInline
                    muted // Add muted
                    onError={(e) => console.error('Video Error (2):', (e.target as HTMLVideoElement).error)} // Fix error handler type
                  />
                  {playingVideo !== 1 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={() => setPlayingVideo(playingVideo === 1 ? null : 1)}>
                      <Button variant="outline" size="icon" className="rounded-full bg-black/50 border-white/20">
                        <Play className="h-6 w-6 text-white" />
                      </Button>
                    </div>
                  )}
                 </div>
               </div>
               <p className="text-sm text-white/50 mt-2 text-center">Example videos generated with {model.name}</p>
             </div>

             {/* Example frames section removed - we only show videos */}

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <Link href={`https://replicate.com/${model.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10">
                  View on Replicate
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/video">
                <Button>Try This Model</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
