import Replicate from "replicate"
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize the Replicate client using the environment variable
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

if (!process.env.REPLICATE_API_TOKEN) {
  console.error("Error: REPLICATE_API_TOKEN is not set in the environment variables.");
  process.exit(1); // Exit if the token is missing
}

// Define an interface for the test result structure
interface TestResult {
  model: string;
  success: boolean;
  output?: any; // Adjust 'any' if you have a more specific output type
  error?: string;
}

// Image models to test
const imageModels = [
  {
    id: "stability-ai/sdxl",
    version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    input: {
      prompt: "A stunning landscape with mountains and a lake",
      negative_prompt: "blurry, bad quality, distorted",
      width: 1024,
      height: 1024,
      num_outputs: 1,
      scheduler: "K_EULER",
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  },
  {
    id: "prompthero/midjourney-v5",
    version: "9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb",
    input: {
      prompt: "A beautiful portrait of a woman in the style of Alphonse Mucha",
      negative_prompt: "ugly, deformed, disfigured, poor details, bad anatomy",
      width: 1024,
      height: 1024,
      num_outputs: 1,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  },
  {
    id: "SG161222/Realistic_Vision_V5.1",
    version: "2d87f0f8bc5b0c0642fc2dba4394b5c6acdda3cd4269fe43a9547b9099ac9c19",
    input: {
      prompt: "Portrait of a young man with blue eyes, photorealistic, 8k, detailed",
      negative_prompt: "cartoon, illustration, anime, painting, drawing, blurry, deformed",
      width: 1024,
      height: 1024,
      num_outputs: 1,
      scheduler: "DPMSolverMultistep",
      num_inference_steps: 30,
      guidance_scale: 7,
    },
  },
  {
    id: "cjwbw/anything-v5",
    version: "3b5c0242f8925a4ab6c79b4c51e9c6997098e6c9f9c97abda71f7c76d545c7c8",
    input: {
      prompt: "anime girl with blue hair and green eyes, detailed, high quality",
      negative_prompt: "lowres, bad anatomy, bad hands, cropped, worst quality",
      width: 1024,
      height: 1024,
      num_outputs: 1,
      num_inference_steps: 30,
      guidance_scale: 7,
    },
  },
  {
    id: "RunDiffusion/juggernaut-xl",
    version: "b79b43456195c8d4e0dbd7b1c1a0ce1e32cf1dab95619a9c0b3c0ded3c1c7f12",
    input: {
      prompt: "A hyper-realistic photograph of a futuristic cityscape, 8k, detailed",
      negative_prompt: "ugly, deformed, noisy, blurry, distorted, grainy",
      width: 1024,
      height: 1024,
      num_outputs: 1,
      scheduler: "K_EULER",
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  },
]

// Video models to test
const videoModels = [
  {
    id: "cjwbw/zeroscope-v2-xl",
    version: "b72a11ca2f4c10d9e10c5b6e1d1a71d0f8c41de0c1dea9d83f6b37bf1fad9f43",
    input: {
      prompt: "A cinematic shot of a person walking through a forest",
      negative_prompt: "blurry, low quality, distorted, glitchy",
      fps: 24,
      num_frames: 24,
      width: 1024,
      height: 576,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  },
  {
    id: "lucataco/animov",
    version: "c4c54e3c5a54c5691a7f7ebf6f7d28e3a1e88d1af0c5a4c2e48a0d6bb4a1c5a4",
    input: {
      prompt: "A cartoon character dancing in a colorful room",
      negative_prompt: "blurry, low quality, distorted, glitchy",
      num_frames: 16,
      width: 512,
      height: 512,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  },
  {
    id: "damo-vilab/modelscope-text-to-video-synthesis",
    version: "a3ca2cb89f7c1b3f5289c45c8a8bf3d9b8f9c0d7c5f9b3d9c8a8bf3d9b8f9c0d7",
    input: {
      prompt: "A panda eating bamboo on a rock",
      negative_prompt: "blurry, low quality, distorted, glitchy",
      num_frames: 16,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  },
]

// Function to test a model
async function testModel(type: string, model: any): Promise<TestResult> { // Update return type
  console.log(`Testing ${type} model: ${model.id}...`)

  try {
    const prediction = await replicate.predictions.create({
      version: model.version,
      input: model.input,
    })

    console.log(`Created prediction: ${prediction.id}`)

    // Poll for the prediction result
    let result = await replicate.predictions.get(prediction.id)

    while (result.status !== "succeeded" && result.status !== "failed") {
      console.log(`Prediction status: ${result.status}`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      result = await replicate.predictions.get(prediction.id)
    }

    if (result.status === "succeeded") {
      console.log(`✅ ${model.id} test successful!`)
      console.log(`Output: ${JSON.stringify(result.output)}`)
      return { model: model.id, success: true, output: result.output }
    } else {
      console.error(`❌ ${model.id} test failed: ${result.error}`)
      return { model: model.id, success: false, error: String(result.error) } // Ensure error is string
    }
  } catch (error: unknown) { // Type the error as unknown
    console.error(`❌ Error testing ${model.id}:`, error)
    // Type guard or assertion to get the message
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { model: model.id, success: false, error: errorMessage }
  }
}

// Main function to run all tests
async function runTests() {
  console.log("Starting model tests...")

  // Correctly type the results object
  const results: { image: TestResult[]; video: TestResult[] } = {
    image: [],
    video: [],
  }

  // Test image models
  console.log("\n=== Testing Image Models ===\n")
  for (const model of imageModels) {
    const result = await testModel("image", model)
    results.image.push(result)
    console.log("\n---\n")
  }

  // Test video models
  console.log("\n=== Testing Video Models ===\n")
  for (const model of videoModels) {
    const result = await testModel("video", model)
    results.video.push(result)
    console.log("\n---\n")
  }

  // Print summary
  console.log("\n=== Test Results Summary ===\n")

  console.log("Image Models:")
  results.image.forEach((result) => {
    console.log(`${result.model}: ${result.success ? "✅ Success" : "❌ Failed"}`)
  })

  console.log("\nVideo Models:")
  results.video.forEach((result) => {
    console.log(`${result.model}: ${result.success ? "✅ Success" : "❌ Failed"}`)
  })

  // Calculate success rates
  const imageSuccessRate = (results.image.filter((r) => r.success).length / results.image.length) * 100
  const videoSuccessRate = (results.video.filter((r) => r.success).length / results.video.length) * 100
  const overallSuccessRate =
    ([...results.image, ...results.video].filter((r) => r.success).length /
      (results.image.length + results.video.length)) *
    100

  console.log(`\nSuccess Rates:`)
  console.log(`Image Models: ${imageSuccessRate.toFixed(2)}%`)
  console.log(`Video Models: ${videoSuccessRate.toFixed(2)}%`)
  console.log(`Overall: ${overallSuccessRate.toFixed(2)}%`)
}

// Run the tests
runTests().catch(console.error)
