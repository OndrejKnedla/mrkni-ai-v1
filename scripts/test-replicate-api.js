/**
 * This script tests the Replicate API directly
 * Run it with: node scripts/test-replicate-api.js
 */

// Get the Replicate API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Check if the token exists
if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN is not set in environment variables');
  process.exit(1);
}

console.log(`✅ REPLICATE_API_TOKEN is set (length: ${REPLICATE_API_TOKEN.length})`);

// Test the token by making a simple API call
async function testReplicateAPI() {
  try {
    console.log('Testing Replicate API...');
    
    // Test the models endpoint
    const modelsResponse = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
      },
    });
    
    if (modelsResponse.ok) {
      console.log('✅ Successfully connected to Replicate API');
      const modelsData = await modelsResponse.json();
      console.log(`Found ${modelsData.results.length} models`);
    } else {
      console.error('❌ Failed to connect to Replicate API:', await modelsResponse.text());
      process.exit(1);
    }
    
    // Test a specific model
    const modelId = 'stability-ai/stable-video-diffusion';
    const modelResponse = await fetch(`https://api.replicate.com/v1/models/${modelId}`, {
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
      },
    });
    
    if (modelResponse.ok) {
      console.log(`✅ Successfully found model ${modelId}`);
      const modelData = await modelResponse.json();
      console.log(`Latest version: ${modelData.latest_version?.id || 'unknown'}`);
      
      // Test creating a prediction
      if (modelData.latest_version?.id) {
        console.log(`Testing prediction creation with ${modelId}...`);
        
        const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: modelData.latest_version.id,
            input: {
              prompt: 'A butterfly landing on a flower, close-up shot',
              num_frames: 16,
              fps: 8,
            },
          }),
        });
        
        if (predictionResponse.ok) {
          const predictionData = await predictionResponse.json();
          console.log(`✅ Successfully created prediction: ${predictionData.id}`);
          console.log(`Status: ${predictionData.status}`);
          console.log(`URL: ${predictionData.urls?.get || 'unknown'}`);
        } else {
          console.error('❌ Failed to create prediction:', await predictionResponse.text());
        }
      }
    } else {
      console.error(`❌ Failed to find model ${modelId}:`, await modelResponse.text());
    }
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('❌ Error testing Replicate API:', error);
    process.exit(1);
  }
}

// Run the tests
testReplicateAPI().catch(console.error);
