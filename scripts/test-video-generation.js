/**
 * This script tests the video generation API directly
 * Run it with: node scripts/test-video-generation.js
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3002/api/generate-video';
const TEST_MODELS = [
  {
    id: 'lucataco/animate-diff',
    version: 'beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f',
    prompt: 'A butterfly landing on a flower, close-up shot',
    negative_prompt: 'low quality, bad anatomy, blurry, pixelated',
    type: 'text-to-video'
  },
  {
    id: 'lucataco/hotshot-xl',
    version: '78b3a6257e16e4b241245d65c8b2b81ea2e1ff7ed4c55306b511509ddbfd327a',
    prompt: 'A butterfly landing on a flower, close-up shot',
    negative_prompt: 'low quality, bad anatomy, blurry, pixelated',
    type: 'text-to-video'
  },
  {
    id: 'ali-vilab/i2vgen-xl',
    version: '5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4',
    prompt: 'Animate this image with natural motion',
    image: 'data:image/jpeg;base64,...', // You'll need to add a base64 image here
    type: 'image-to-video'
  }
];

// Function to read an image file and convert it to base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

// Function to test a model
async function testModel(model) {
  console.log(`Testing ${model.type} model: ${model.id}`);
  
  // Prepare the request body
  const requestBody = {
    modelId: model.id,
    version: model.version,
    prompt: model.prompt,
    negative_prompt: model.negative_prompt,
    width: 512,
    height: 512,
    num_frames: 16,
    fps: 8,
    seed: 12345,
    guidance_scale: 7.5,
    num_inference_steps: 25
  };
  
  // Add image for image-to-video models
  if (model.type === 'image-to-video' && model.image) {
    requestBody.image = model.image;
  }
  
  try {
    // Make the API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Parse the response
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Model ${model.id} (${model.type}) returned:`);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`❌ Error with model ${model.id} (${model.type}):`);
      console.error(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(`❌ Exception with model ${model.id} (${model.type}):`);
    console.error(error);
  }
  
  console.log('-----------------------------------');
}

// Main function
async function main() {
  console.log('Starting video generation API tests...');
  
  // Test each model
  for (const model of TEST_MODELS) {
    // Skip image-to-video tests if no image is provided
    if (model.type === 'image-to-video' && (!model.image || model.image === 'data:image/jpeg;base64,...')) {
      console.log(`⚠️ Skipping ${model.id} (${model.type}) - no test image provided`);
      console.log('-----------------------------------');
      continue;
    }
    
    await testModel(model);
    
    // Add a delay between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('All tests completed!');
}

// Run the main function
main().catch(console.error);
