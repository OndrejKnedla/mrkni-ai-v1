import { VideoModel } from '@/lib/types';

// Version will be fetched dynamically in the API route
// const LUMA_RAY_FLASH_VERSION = "181f49a7f492646678442d408471393b9458180996098066e3311550efa72771"; // Removed

export const videoModels: VideoModel[] = [
  {
    id: "luma/ray-flash-2-540p", // Corrected model ID
    name: "Luma Ray Flash 2 (540p)",
    description: "Generates videos based on a prompt and optional start/end images.",
    version: "", // Version will be fetched dynamically
    parameters: {
      prompt: { type: "string", required: true, description: "Text prompt for video generation" },
      start_image_url: { type: "string", required: false, description: "URL of an image to use as the starting frame" },
      end_image_url: { type: "string", required: false, description: "URL of an image to use as the ending frame" },
      duration: { type: "integer", default: 5, description: "Duration of the video in seconds (Fixed at 5s)" }, // Updated default
      aspect_ratio: { type: "string", default: "16:9", description: "Aspect ratio of the generated video (Fixed at 16:9)" },
      seed: { type: "integer", required: false, description: "Seed for reproducibility" },
      negative_prompt: { type: "string", required: false, description: "Negative prompt" }, // Luma supports negative prompt
      guidance_scale: { type: "number", required: false, default: 7.5, description: "Guidance scale" }, // Luma supports guidance scale
      // Note: Luma doesn't seem to use num_inference_steps directly in its main API schema
    },
    default_params: {
      duration: 5, // Updated default
      aspect_ratio: "16:9",
      guidance_scale: 7.5, // Add default guidance
    },
    // Add flags based on Luma model capabilities
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    supportsSeed: true,
    supportsSteps: false, // Luma doesn't explicitly list steps
    supportsTextToVideo: true,
    supportsImageToVideo: true, // Via start/end image URLs
    maxResolution: "960x540", // Based on model name, adjust if needed
    defaultDuration: 5, // Updated fixed duration
    defaultFPS: 24, // Luma default FPS is often 24
    maxDuration: 9, // Luma's typical max duration (allow 5 or 9)
    tier: "premium", // Assuming Luma might be premium, adjust as needed
    status: "active",
  },
];

export const defaultVideoModel = videoModels[0]; // Only one model now
