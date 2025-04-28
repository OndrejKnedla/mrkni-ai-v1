export interface User {
  id: string
  email: string | null
  created_at: string
}

// Interface defining the structure for a video model configuration
export interface VideoModel {
  id: string; // e.g., "lumaai/luma-ray-flash-2-540p"
  name: string; // e.g., "Luma Ray Flash 2 (540p)"
  description: string;
  version: string; // Replicate model version ID
  parameters: Record<string, {
    type: string; // e.g., "string", "integer", "boolean"
    required?: boolean;
    default?: any;
    description: string;
  }>;
  default_params?: Record<string, any>;
  requires_image?: boolean;
  mode?: "text-to-video" | "image-to-video"; // Indicate primary mode
  premium?: boolean;
  status?: "active" | "inactive";
  // Add capability flags
  supportsNegativePrompt?: boolean;
  supportsGuidanceScale?: boolean;
  supportsSeed?: boolean;
  supportsSteps?: boolean; // e.g., num_inference_steps
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  maxResolution?: string; // e.g., "1024x576"
  defaultDuration?: number; // Default duration in seconds
  defaultFPS?: number; // Default frames per second
  maxDuration?: number; // Max duration in seconds
  defaultNegativePrompt?: string; // Default negative prompt
  additionalParams?: Record<string, any>; // For any other fixed params
  tier?: 'free' | 'basic' | 'premium'; // Add tier property
  // Add missing properties used in model page
  examplePrompt?: string;
  provider?: string; // e.g., "replicate", "luma", "google"
  strengths?: string[]; // Array of strings describing strengths
  outputFormat?: string; // e.g., "mp4", "gif"
}

export interface GenerationParams {
  prompt: string
  negative_prompt?: string
  width: number
  height: number
  num_inference_steps: number
  guidance_scale: number
  num_images: number
  scheduler: string
  seed?: number
  model: string
  image?: string // Add optional image field (base64 data URL)
  // Add optional video params used in history conversion
  num_frames?: number | null;
  fps?: number | null;
  aspect_ratio?: string; // Add aspect ratio
}

export interface GenerationResult {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled" | string // Allow specific statuses or any string
  input: GenerationParams
  output: string[] | null
  error?: string
  created_at: string
  model?: string // Add optional model property for storing the human-readable model name
}

export interface ImageGeneration {
  id: string
  user_id: string
  prompt: string
  negative_prompt: string | null
  width: number
  height: number
  steps: number
  guidance_scale: number
  scheduler: string
  seed: number | null
  model: string
  created_at: string
  generated_images?: GeneratedImage[] // Match Supabase query key
  // Add optional status and error fields
  status?: string | null;
  error?: string | null;
}

export interface GeneratedImage {
  id: string
  generation_id: string
  image_url: string
  created_at: string
  model?: string // Add optional model property for storing the human-readable model name
}

// Define VideoGeneration type based on video_generations table
export interface VideoGeneration {
  // id: string // Replicate ID - Use replicate_id instead
  replicate_id: string; // Use this as the primary identifier from Replicate
  user_id: string;
  prompt: string;
  negative_prompt: string | null
  width: number
  height: number
  num_frames: number | null
  fps: number | null
  seed: number | null;
  model_id: string; // Model ID used
  status: string; // Allow any string status from Replicate/DB
  output_url: string | null; // URL of the generated video
  error: string | null; // Error message if failed
  created_at: string
}


export interface HistoryItem extends GenerationResult {
  id: string
  created_at: string
  type?: 'image' | 'video' // Add optional type field
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface PromptSuggestion {
  subject: string
  environment: string
  style: string
  atmosphere: string
  colors: string
  details: string
  negativePrompt: string
}

export interface PromptTemplate {
  id: string
  name: string
  template: string
  category: string | null
  created_at: string
}
