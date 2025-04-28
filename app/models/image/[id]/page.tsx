"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { replicateModels } from "@/lib/replicate/models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Image } from "@/components/ui/image"

export default function ImageModelPage() {
  const params = useParams()
  const modelId = decodeURIComponent(params.id as string)
  const [model, setModel] = useState<(typeof replicateModels)[0] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // First try to find the model by exact ID match
    let foundModel = replicateModels.find((m) => m.id === modelId)

    // If not found and the ID doesn't contain a slash, try to find by the model part only
    if (!foundModel && !modelId.includes('/')) {
      foundModel = replicateModels.find((m) => {
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
          <Link href="/ai-models?tab=image-models">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Models
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Generate example images based on model ID using the new images folder
  // Map model IDs to folder names
  const getModelFolder = (id: string) => {
    // Extract the model name part (after the slash)
    const modelPart = id.split('/').pop() || id

    // Handle special cases for various models
    if (modelPart.includes('ideogram')) {
      // Special case for ideogram-v2a-turbo
      if (modelPart === 'ideogram-v2a-turbo') {
        return 'ideogram-v2a-turbo'
      }
      return modelPart
    }
    if (modelPart.includes('stable-diffusion')) {
      return modelPart
    }
    if (modelPart === 'image-01') {
      return 'image-01'
    }
    // Handle other specific models
    if (modelPart === 'photon' || modelPart === 'photon-flash') {
      return modelPart
    }
    if (modelPart === 'imagen-3' || modelPart === 'imagen-3-fast') {
      return modelPart
    }
    if (modelPart.includes('flux')) {
      return modelPart
    }
    if (modelPart.includes('recraft')) {
      return modelPart
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
    if (
      modelPart === 'imagen-3' ||
      modelPart === 'imagen-3-fast' ||
      modelPart === 'ideogram-v2a-turbo'
    ) {
      return 'png'
    }
    // Models that use SVG
    if (modelPart === 'recraft-v3-svg') {
      return 'svg'
    }
    // Models that use JPEG
    if (modelPart === 'image-01') {
      return 'jpeg'
    }
    // Default to webp for most models
    return 'webp'
  }

  const modelFolder = getModelFolder(model.id)
  const fileExtension = getFileExtension(model.id)
  const exampleImages = [
    `/images/images-ai/${modelFolder}/1.${fileExtension}`,
    `/images/images-ai/${modelFolder}/2.${fileExtension}`,
    `/images/images-ai/${modelFolder}/3.${fileExtension}`,
    `/images/images-ai/${modelFolder}/4.${fileExtension}`,
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/ai-models?tab=image-models"
          className="inline-flex items-center text-white/70 hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Image Models
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
                variant={model.tier === "premium" ? "default" : model.tier === "basic" ? "secondary" : "outline"}
                className={
                  model.tier === "premium"
                    ? "bg-green-600 text-white" // Premium (green)
                    : model.tier === "basic"
                      ? "bg-orange-500 text-white" // Basic (orange)
                      : "bg-gray-500 text-white" // Free (grey)
                }
              >
                {model.tier.charAt(0).toUpperCase() + model.tier.slice(1)} Tier
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-white/90">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Description</h3>
              <p>{model.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Key Strengths</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {model.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-md">
                  <p className="mb-1">
                    <strong>Maximum Dimension:</strong> {model.maxDimension}x{model.maxDimension}
                  </p>
                  <p className="mb-1">
                    <strong>Minimum Dimension:</strong> {model.minDimension}x{model.minDimension}
                  </p>
                  <p className="mb-1">
                    <strong>Default Steps:</strong> {model.defaultSteps}
                  </p>
                  <p>
                    <strong>Default Guidance Scale:</strong> {model.defaultGuidanceScale}
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-md">
                  <p className="mb-1">
                    <strong>Supports Negative Prompt:</strong> {model.supportsNegativePrompt ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Supports Multiple Outputs:</strong> {model.supportsMultipleOutputs ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Supports Seed:</strong> {model.supportsSeed ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Output Format:</strong> {model.outputFormat.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Example Prompt</h3>
              <div className="bg-black/20 p-4 rounded-md">
                <p className="italic">
                  "
                  {model.examplePrompt ||
                    "A serene Japanese garden with a small bridge over a koi pond, cherry blossoms falling, photorealistic style, golden hour lighting"}
                  "
                </p>
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
              <h3 className="text-lg font-medium text-white mb-4">Example Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {exampleImages.map((src, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-black/40">
                    <Image
                      src={src}
                      alt={`Example ${index + 1} from ${model.name}`}
                      fill
                      className="object-cover"
                      fallbackSrc="/placeholder/image.svg"
                      onError={(e) => {
                        console.log(`Trying to load alternative for: ${src}`)
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/50 mt-2 text-center">Example images generated with {model.name}</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <Link href={`https://replicate.com/${model.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10">
                  View on Replicate
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button>Try This Model</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
