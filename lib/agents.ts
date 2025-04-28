// MrkniAI Agent definitions
export type AgentTier = "free" | "basic" | "premium" | "pro"

export interface MrkniAIAgent {
  id: string
  name: string
  description: string
  tier: AgentTier
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
  models?: string[] // Underlying AI models used by this agent
  additionalParams?: {
    maxSteps?: number
    [key: string]: any
  }
}

export const agentConfig = {
  agents: [
    // PRO AGENTS
    {
      id: "mrkniai-agent-2.5",
      name: "MrkniAI Agent 2.5",
      description: "Our most advanced AI agent with exceptional image generation capabilities.",
      tier: "pro" as AgentTier,
      version: "2.5",
      maxDimension: 2048,
      minDimension: 512,
      defaultWidth: 1024,
      defaultHeight: 1024,
      defaultSteps: 30,
      defaultGuidanceScale: 7.5,
      supportsNegativePrompt: true,
      supportsMultipleOutputs: true,
      supportsSeed: true,
      supportsGuidanceScale: true,
      supportsSteps: true,
      outputFormat: "png",
      models: [
        "stability-ai/stable-diffusion-3.5-large",
        "luma/photon",
        "ideogram-ai/ideogram-v2",
        "google/imagen-3",
        "flux-1.1-pro-ultra"
      ],
    },
    {
      id: "mrkniai-agent-2.0",
      name: "MrkniAI Agent 2.0",
      description: "Professional-grade AI agent with high-quality image generation.",
      tier: "pro" as AgentTier,
      version: "2.0",
      maxDimension: 1536,
      minDimension: 512,
      defaultWidth: 1024,
      defaultHeight: 1024,
      defaultSteps: 30,
      defaultGuidanceScale: 7.5,
      supportsNegativePrompt: true,
      supportsMultipleOutputs: true,
      supportsSeed: true,
      supportsGuidanceScale: true,
      supportsSteps: true,
      outputFormat: "png",
      models: [
        "stability-ai/stable-diffusion-3.5-medium",
        "stability-ai/stable-diffusion-3.5-large-turbo",
        "photon-flash",
        "imagen-3-fast",
        "flux-1.1-pro"
      ],
    },

    // PREMIUM AGENTS
    {
      id: "mrkniai-agent-1.5",
      name: "MrkniAI Agent 1.5",
      description: "Advanced AI agent with premium image generation capabilities.",
      tier: "premium" as AgentTier,
      version: "1.5",
      maxDimension: 1536,
      minDimension: 512,
      defaultWidth: 1024,
      defaultHeight: 1024,
      defaultSteps: 30,
      defaultGuidanceScale: 7.5,
      supportsNegativePrompt: true,
      supportsMultipleOutputs: true,
      supportsSeed: true,
      supportsGuidanceScale: true,
      supportsSteps: true,
      outputFormat: "png",
      models: [
        "ideogram-ai/ideogram-v2-turbo",
        "recraft-ai/recraft-v3",
        "recraft-ai/recraft-v3-svg",
        "minimax/image-01",
        "flux-pro"
      ],
    },

    // BASIC/FREE AGENTS
    {
      id: "mrkniai-agent-1.0",
      name: "MrkniAI Agent 1.0",
      description: "Our standard AI agent for quality image generation.",
      tier: "free" as AgentTier,
      version: "1.0",
      maxDimension: 1024,
      minDimension: 512,
      defaultWidth: 1024,
      defaultHeight: 1024,
      defaultSteps: 30,
      defaultGuidanceScale: 7.5,
      supportsNegativePrompt: true,
      supportsMultipleOutputs: true,
      supportsSeed: true,
      supportsGuidanceScale: true,
      supportsSteps: true,
      outputFormat: "png",
      models: [
        "black-forest-labs/flux-schnell",
        "black-forest-labs/flux-dev"
      ],
    },
  ],
  defaultAgent: "mrkniai-agent-1.0",
  aspectRatios: [
    { label: "1:1", value: "1:1" },
    { label: "16:9", value: "16:9" },
    { label: "21:9", value: "21:9" },
    { label: "3:2", value: "3:2" },
    { label: "2:3", value: "2:3" },
    { label: "4:5", value: "4:5" },
    { label: "5:4", value: "5:4" },
    { label: "3:4", value: "3:4" },
    { label: "4:3", value: "4:3" },
    { label: "9:16", value: "9:16" },
    { label: "9:21", value: "9:21" },
  ],
  defaultSteps: 30,
  defaultGuidance: 7.5,
  defaultNumOutputs: 1,
  maxNumOutputs: 10,
}

export function getAvailableAgents(tier: AgentTier): MrkniAIAgent[] {
  const tierLevels = { free: 0, basic: 1, premium: 2, pro: 3 }
  const userTierLevel = tierLevels[tier]

  return agentConfig.agents.filter((agent) => {
    const agentTierLevel = tierLevels[agent.tier]
    return agentTierLevel <= userTierLevel
  })
}

export function getAgentById(id: string): MrkniAIAgent | undefined {
  return agentConfig.agents.find((agent) => agent.id === id)
}

export function getAgentsByTier(tier: AgentTier): MrkniAIAgent[] {
  return agentConfig.agents.filter((agent) => agent.tier === tier)
}
