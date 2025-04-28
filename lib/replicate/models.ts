// Model types and interfaces
export interface ModelVersion {
  id: string
  version: string
  description?: string
}

export interface ModelCapabilities {
  supportsNegativePrompt: boolean
  supportsMultipleOutputs: boolean
  supportsSeed: boolean
  supportsGuidanceScale: boolean
  supportsSteps: boolean
  maxDimension: number
  minDimension: number
  defaultWidth: number
  defaultHeight: number
  defaultSteps: number
  defaultGuidanceScale: number
  outputFormat: "png" | "jpeg" | "svg" | "multiple"
}

export interface AIModel extends ModelVersion, ModelCapabilities {
  name: string
  provider: string
  tier: "free" | "basic" | "premium"
  strengths: string[]
  examplePrompt?: string
  defaultNegativePrompt?: string
  additionalParams?: Record<string, any>
}

// Define all models
export const replicateModels: AIModel[] = [
  // Ideogram Models
  {
    id: "ideogram-ai/ideogram-v2",
    name: "Ideogram v2",
    provider: "Ideogram AI",
    version: "4a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "premium",
    description: "An excellent image model with state of the art inpainting, prompt comprehension and text rendering.",
    strengths: ["Text rendering", "Prompt comprehension", "Inpainting"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A beautiful sunset over a mountain range, with vibrant colors and detailed landscape",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "ideogram-ai/ideogram-v2-turbo",
    name: "Ideogram v2 Turbo",
    provider: "Ideogram AI",
    version: "3a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "A fast image model with state of the art inpainting, prompt comprehension and text rendering.",
    strengths: ["Fast generation", "Text rendering", "Prompt comprehension"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A beautiful sunset over a mountain range, with vibrant colors and detailed landscape",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },

  // Google Imagen Models
  {
    id: "google/imagen-3",
    name: "Imagen 3",
    provider: "Google",
    version: "e5a2deb4c2f9d2c0c67bb7d051e1e48d6d4ea15a6b7a8d2b12eeddf2a6b8e6f1",
    tier: "premium",
    description: "Google's advanced text-to-image model with excellent quality and prompt following.",
    strengths: ["Photorealistic images", "Excellent prompt adherence", "High detail"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A photorealistic portrait of a young woman with freckles, natural lighting, detailed skin texture",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "google/imagen-3-fast",
    name: "Imagen 3 Fast",
    provider: "Google",
    version: "8b5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "premium",
    description: "A faster version of Google's Imagen 3 model with excellent quality and prompt following.",
    strengths: ["Fast generation", "Good prompt adherence", "High quality"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A photorealistic portrait of a young woman with freckles, natural lighting, detailed skin texture",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },

  // Luma Models
  {
    id: "luma-ai/photon",
    name: "Photon",
    provider: "Luma AI",
    version: "b17a0e0d6c8e5f7a8c9d2e3f4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
    tier: "premium",
    description: "A high-quality image generation model with excellent photorealism.",
    strengths: ["Photorealistic images", "Natural lighting", "Detailed textures"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A photorealistic landscape of a mountain lake at sunset, with detailed reflections in the water",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "luma-ai/photon-flash",
    name: "Photon Flash",
    provider: "Luma AI",
    version: "7b5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "premium",
    description: "A faster version of Photon with excellent photorealism and quick generation times.",
    strengths: ["Fast generation", "Photorealistic images", "Natural lighting"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A photorealistic landscape of a mountain lake at sunset, with detailed reflections in the water",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },

  // Black Forest Labs Flux Models
  {
    id: "black-forest-labs/flux-1.1-pro-ultra",
    name: "Flux 1.1 Pro Ultra",
    provider: "Black Forest Labs",
    version: "2f09c9c0d2a6f0a5b4c9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "premium",
    description: "The most powerful Flux model with excellent image quality and prompt adherence.",
    strengths: ["Photorealistic images", "Excellent prompt adherence", "High detail"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A detailed fantasy landscape with a castle on a floating island, magical atmosphere",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "black-forest-labs/flux-1.1-pro",
    name: "Flux 1.1 Pro",
    provider: "Black Forest Labs",
    version: "8a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "High-quality image generation with excellent prompt adherence.",
    strengths: ["Photorealistic images", "Good prompt adherence", "Detailed outputs"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A detailed fantasy landscape with a castle on a floating island, magical atmosphere",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "black-forest-labs/flux-pro",
    name: "Flux Pro",
    provider: "Black Forest Labs",
    version: "7a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "State-of-the-art image generation with top of the line prompt following.",
    strengths: ["Visual quality", "Image detail", "Output diversity"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A detailed fantasy landscape with a castle on a floating island, magical atmosphere",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "black-forest-labs/flux-dev",
    name: "Flux Dev",
    provider: "Black Forest Labs",
    version: "6a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "A 12 billion parameter model capable of generating images from text descriptions.",
    strengths: ["Fast generation", "Good for iterative development"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 768,
    minDimension: 512,
    defaultWidth: 768,
    defaultHeight: 768,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A colorful abstract painting with geometric shapes and vibrant colors",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "black-forest-labs/flux-schnell",
    name: "Flux Schnell",
    provider: "Black Forest Labs",
    version: "5a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "free",
    description: "The fastest image generation model tailored for local development and personal use.",
    strengths: ["Very fast generation", "Good for quick iterations"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 768,
    minDimension: 512,
    defaultWidth: 768,
    defaultHeight: 768,
    defaultSteps: 4, // Maximum allowed is 4 for this model
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A colorful abstract painting with geometric shapes and vibrant colors",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
    additionalParams: {
      maxSteps: 4 // Add this to indicate the maximum allowed steps
    }
  },

  // Stability AI Models
  {
    id: "stability-ai/stable-diffusion-3.5-large",
    name: "Stable Diffusion 3.5 Large",
    provider: "Stability AI",
    version: "9e5a3b2e2c1a7b9b67b9e9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
    tier: "premium",
    description: "A text-to-image model that generates high-resolution images with fine details.",
    strengths: ["High-resolution images", "Fine details", "Artistic styles"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1536,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A detailed fantasy character portrait with intricate armor and magical effects",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "stability-ai/stable-diffusion-3.5-medium",
    name: "Stable Diffusion 3.5 Medium",
    provider: "Stability AI",
    version: "6e5a3b2e2c1a7b9b67b9e9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
    tier: "basic",
    description: "A balanced text-to-image model with good quality and reasonable generation speed.",
    strengths: ["Good quality images", "Balanced performance", "Artistic styles"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A watercolor painting of a coastal village with boats and seagulls",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "stability-ai/stable-diffusion-3.5-large-turbo",
    name: "Stable Diffusion 3.5 Large Turbo",
    provider: "Stability AI",
    version: "5e5a3b2e2c1a7b9b67b9e9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
    tier: "basic",
    description: "A faster version of SD 3.5 Large with excellent generation speed.",
    strengths: ["Fast generation", "Good quality", "Artistic styles"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A watercolor painting of a coastal village with boats and seagulls",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },





  // Recraft Models
  {
    id: "recraft-ai/recraft-v3",
    name: "Recraft v3",
    provider: "Recraft AI",
    version: "0a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "A text-to-image model with the ability to generate long texts and images in a wide list of styles.",
    strengths: ["Wide style range", "Text generation", "Creative compositions"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A colorful abstract painting with geometric shapes and vibrant colors",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },
  {
    id: "recraft-ai/recraft-v3-svg",
    name: "Recraft v3 SVG",
    provider: "Recraft AI",
    version: "9a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "A specialized model for generating SVG vector graphics from text descriptions.",
    strengths: ["Vector graphics", "Scalable images", "Clean designs"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "svg",
    examplePrompt: "A simple logo with geometric shapes",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },

  // MiniMax Models
  {
    id: "minimax/image-01",
    name: "MiniMax Image-01",
    provider: "MiniMax",
    version: "4b5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
    tier: "basic",
    description: "A versatile text-to-image model with good quality and reasonable generation speed.",
    strengths: ["Versatile generation", "Good quality", "Fast inference"],
    supportsNegativePrompt: true,
    supportsMultipleOutputs: true,
    supportsSeed: true,
    supportsGuidanceScale: true,
    supportsSteps: true,
    maxDimension: 1024,
    minDimension: 512,
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 30,
    defaultGuidanceScale: 7.5,
    outputFormat: "png",
    examplePrompt: "A colorful abstract painting with geometric shapes and vibrant colors",
    defaultNegativePrompt: "low quality, bad anatomy, blurry, pixelated, watermark, text, signature",
  },


]

// Helper functions
export function getModelById(id: string): AIModel | undefined {
  return replicateModels.find((model) => model.id === id)
}

export function getModelsByTier(tier: "free" | "basic" | "premium"): AIModel[] {
  return replicateModels.filter((model) => model.tier === tier)
}

export function getAvailableModels(userTier: "free" | "basic" | "premium"): AIModel[] {
  const tierLevels = { free: 0, basic: 1, premium: 2 }
  const userTierLevel = tierLevels[userTier]

  return replicateModels.filter((model) => {
    const modelTierLevel = tierLevels[model.tier]
    return modelTierLevel <= userTierLevel
  })
}

export type ModelConfig = AIModel
