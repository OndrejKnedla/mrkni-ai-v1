// This script can be run with:
// npx tsx scripts/run-model-tests.ts

import { replicateModels } from "../lib/replicate/models"
import { videoModels } from "../lib/replicate/video-models" // Renamed import
import Replicate from "replicate"
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize the Replicate client with the API token from environment
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

if (!process.env.REPLICATE_API_TOKEN) {
  console.error("Error: REPLICATE_API_TOKEN is not set in the environment variables.");
  process.exit(1); // Exit if the token is missing
}

async function testImageModel(model: any) {
  console.log(`Testing image model: ${model.id}...`)

  const input = {
    prompt: model.examplePrompt || "A beautiful landscape",
    negative_prompt: model.defaultNegativePrompt,
    width: model.defaultWidth,
    height: model.defaultHeight,
    num_inference_steps: model.defaultSteps,
    guidance_scale: model.defaultGuidanceScale,
  }

  try {
    // Cast the model identifier string to the expected type
    const modelIdentifier = `${model.id}:${model.version}` as `${string}/${string}:${string}`;
    const output = await replicate.run(modelIdentifier, { input })
    console.log(`✅ ${model.id} test successful!`)
    return { model: model.id, success: true, output }
  } catch (error: unknown) { // Type error as unknown
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${model.id} test failed:`, errorMessage)
    return { model: model.id, success: false, error: errorMessage }
  }
}

async function testVideoModel(model: any) {
  console.log(`Testing video model: ${model.id}...`)

  const input = {
    prompt: model.examplePrompt || "A beautiful landscape",
    negative_prompt: model.defaultNegativePrompt,
    num_inference_steps: model.defaultSteps,
    guidance_scale: model.defaultGuidanceScale,
    fps: model.defaultFPS,
    num_frames: model.defaultFPS * model.defaultDuration,
  }

  try {
    // Cast the model identifier string to the expected type
    const modelIdentifier = `${model.id}:${model.version}` as `${string}/${string}:${string}`;
    const output = await replicate.run(modelIdentifier, { input })
    console.log(`✅ ${model.id} test successful!`)
    return { model: model.id, success: true, output }
  } catch (error: unknown) { // Type error as unknown
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${model.id} test failed:`, errorMessage)
    return { model: model.id, success: false, error: errorMessage }
  }
}

async function main() {
  // Test a sample of image models
  const imageModelsToTest = replicateModels.slice(0, 3) // Test first 3 image models

  console.log("Testing image models...")
  for (const model of imageModelsToTest) {
    await testImageModel(model)
    console.log("---")
  }

  // Test a sample of video models
  const videoModelsToTest = videoModels.slice(0, 2) // Renamed variable, Test first 2 video models

  console.log("\nTesting video models...")
  for (const model of videoModelsToTest) {
    await testVideoModel(model)
    console.log("---")
  }
}

main().catch(console.error)
