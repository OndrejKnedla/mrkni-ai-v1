export const siteConfig = {
  name: "MrkniAI",
  description: "Generate stunning images and videos with the MrkniAI AI generator, using multiple advanced AI models.", // Enhanced description
  url: "https://mrkniai.com",
  ogImage: "https://mrkniai.com/og.jpg",
  links: {
    github: "https://github.com/mrkniai/mrkniai",
    twitter: "https://twitter.com/mrkniai",
  },
}

export type ModelTier = "free" | "basic" | "premium"

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  strengths: string[]
  tier: ModelTier
  version: string
  maxDimension: number
  minDimension?: number
  defaultWidth?: number
  defaultHeight?: number
  defaultSteps?: number
  defaultGuidanceScale?: number
  supportsNegativePrompt: boolean
  supportsMultipleOutputs?: boolean
  supportsSeed?: boolean
  supportsGuidanceScale?: boolean
  supportsSteps?: boolean
  outputFormat?: string
  additionalParams?: {
    maxSteps?: number
    [key: string]: any
  }
}

export const modelConfig = {
  models: [
    // PREMIUM MODELS
    {
      id: "stability-ai/stable-diffusion-3.5-large",
      name: "Stable Diffusion 3.5 Large",
      provider: "Stability AI",
      description: "A text-to-image model that generates high-resolution images with fine details.",
      strengths: ["High-resolution images", "Fine details", "Artistic styles"],
      tier: "premium" as ModelTier,
      version: "9e5a3b2e2c1a7b9b67b9e9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
      maxDimension: 1536,
      supportsNegativePrompt: true,
    },
    {
      id: "google/imagen-3",
      name: "Imagen 3",
      provider: "Google",
      description: "Google's advanced text-to-image model with excellent quality and prompt following.",
      strengths: ["Photorealistic images", "Excellent prompt adherence", "High detail"],
      tier: "premium" as ModelTier,
      version: "2a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "luma/photon",
      name: "Photon",
      provider: "Luma AI",
      description: "A high-quality image generation model with excellent photorealism.",
      strengths: ["Photorealistic images", "Natural lighting", "Detailed textures"],
      tier: "premium" as ModelTier,
      version: "1a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "black-forest-labs/flux-1.1-pro-ultra",
      name: "Flux 1.1 Pro Ultra",
      provider: "Black Forest Labs",
      description: "The most powerful Flux model with excellent image quality and prompt adherence.",
      strengths: ["Photorealistic images", "Excellent prompt adherence", "High detail"],
      tier: "premium" as ModelTier,
      version: "2f09c9c0d2a6f0a5b4c9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "ideogram-ai/ideogram-v2",
      name: "Ideogram v2",
      provider: "Ideogram AI",
      description: "An excellent image model with state of the art inpainting, prompt comprehension and text rendering.",
      strengths: ["Text rendering", "Prompt comprehension", "Inpainting"],
      tier: "premium" as ModelTier,
      version: "4a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "google/imagen-3-fast",
      name: "Imagen 3 Fast",
      provider: "Google",
      description: "A faster version of Google's Imagen 3 model with excellent quality and prompt following.",
      strengths: ["Fast generation", "Good prompt adherence", "High quality"],
      tier: "premium" as ModelTier,
      version: "8b5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "luma/photon-flash",
      name: "Photon Flash",
      provider: "Luma AI",
      description: "A faster version of Photon with excellent photorealism and quick generation times.",
      strengths: ["Fast generation", "Photorealistic images", "Natural lighting"],
      tier: "premium" as ModelTier,
      version: "7b5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },

    // BASIC MODELS
    {
      id: "stability-ai/stable-diffusion-3.5-medium",
      name: "Stable Diffusion 3.5 Medium",
      provider: "Stability AI",
      description: "A balanced text-to-image model with good quality and reasonable generation speed.",
      strengths: ["Good quality images", "Balanced performance", "Artistic styles"],
      tier: "basic" as ModelTier,
      version: "6e5a3b2e2c1a7b9b67b9e9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "stability-ai/stable-diffusion-3.5-large-turbo",
      name: "Stable Diffusion 3.5 Large Turbo",
      provider: "Stability AI",
      description: "A faster version of SD 3.5 Large with excellent generation speed.",
      strengths: ["Fast generation", "Good quality", "Artistic styles"],
      tier: "basic" as ModelTier,
      version: "5e5a3b2e2c1a7b9b67b9e9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "black-forest-labs/flux-1.1-pro",
      name: "Flux 1.1 Pro",
      provider: "Black Forest Labs",
      description: "High-quality image generation with excellent prompt adherence.",
      strengths: ["Photorealistic images", "Good prompt adherence", "Detailed outputs"],
      tier: "basic" as ModelTier,
      version: "8a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "black-forest-labs/flux-pro",
      name: "Flux Pro",
      provider: "Black Forest Labs",
      description: "State-of-the-art image generation with top of the line prompt following.",
      strengths: ["Visual quality", "Image detail", "Output diversity"],
      tier: "basic" as ModelTier,
      version: "7a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "ideogram-ai/ideogram-v2-turbo",
      name: "Ideogram v2 Turbo",
      provider: "Ideogram AI",
      description: "A fast image model with state of the art inpainting, prompt comprehension and text rendering.",
      strengths: ["Fast generation", "Text rendering", "Prompt comprehension"],
      tier: "basic" as ModelTier,
      version: "3a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "recraft-ai/recraft-v3",
      name: "Recraft v3",
      provider: "Recraft AI",
      description: "A text-to-image model with the ability to generate long texts and images in a wide list of styles.",
      strengths: ["Wide style range", "Text generation", "Creative compositions"],
      tier: "basic" as ModelTier,
      version: "0a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "recraft-ai/recraft-v3-svg",
      name: "Recraft v3 SVG",
      provider: "Recraft AI",
      description: "A specialized model for generating SVG vector graphics from text descriptions.",
      strengths: ["Vector graphics", "Scalable images", "Clean designs"],
      tier: "basic" as ModelTier,
      version: "9a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },
    {
      id: "minimax/image-01",
      name: "MiniMax Image-01",
      provider: "MiniMax",
      description: "A versatile text-to-image model with good quality and reasonable generation speed.",
      strengths: ["Versatile generation", "Good quality", "Fast inference"],
      tier: "basic" as ModelTier,
      version: "4b5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 1024,
      supportsNegativePrompt: true,
    },

    {
      id: "black-forest-labs/flux-dev",
      name: "Flux Dev",
      provider: "Black Forest Labs",
      description: "A 12 billion parameter model capable of generating images from text descriptions.",
      strengths: ["Fast generation", "Good for iterative development"],
      tier: "basic" as ModelTier,
      version: "6a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 768,
      supportsNegativePrompt: true,
    },

    // FREE MODELS
    {
      id: "black-forest-labs/flux-schnell",
      name: "Flux Schnell",
      provider: "Black Forest Labs",
      description: "The fastest image generation model tailored for local development and personal use.",
      strengths: ["Very fast generation", "Good for quick iterations"],
      tier: "free" as ModelTier, // Reverted back to free
      version: "5a5c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9c8c9f9",
      maxDimension: 768,
      defaultSteps: 4,
      supportsNegativePrompt: true,
      additionalParams: {
        maxSteps: 4 // Maximum allowed steps for this model
      },
    },
  ],
  defaultModel: "black-forest-labs/flux-schnell",
  defaultDimensions: [
    { label: "512x512", value: "512x512" },
    { label: "768x768", value: "768x768" },
    { label: "1024x1024", value: "1024x1024" },
    { label: "1536x1536", value: "1536x1536" },
  ],
  defaultSteps: 30,
  defaultGuidance: 7.5,
  defaultNumImages: 1,
  schedulers: [
    { label: "DPM++ 2M Karras", value: "DPM++ 2M Karras" },
    { label: "DPM++ SDE Karras", value: "DPM++ SDE Karras" },
    { label: "Euler a", value: "Euler a" },
  ],
}

export function getAvailableModels(tier: ModelTier): AIModel[] {
  const tierLevels = { free: 0, basic: 1, premium: 2 }
  const userTierLevel = tierLevels[tier]

  return modelConfig.models.filter((model) => {
    const modelTierLevel = tierLevels[model.tier]
    return modelTierLevel <= userTierLevel
  })
}

export function getModelById(id: string): AIModel | undefined {
  return modelConfig.models.find((model) => model.id === id)
}

export function getModelsByTier(tier: ModelTier): AIModel[] {
  return modelConfig.models.filter((model) => model.tier === tier)
}
