/**
 * This script checks if the Replicate API token is valid and if we can access the models
 * Run it with: npx tsx scripts/check-replicate-access.ts
 */

import { videoModels } from '../lib/replicate/video-models'; // Renamed import

async function checkReplicateAccess() {
  console.log('Checking Replicate API access...');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN is not set in environment variables');
    return;
  }
  
  console.log('✅ REPLICATE_API_TOKEN is set');
  
  // Check if we can access the Replicate API
  try {
    const response = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    });
    
    if (response.ok) {
      console.log('✅ Successfully connected to Replicate API');
    } else {
      console.error('❌ Failed to connect to Replicate API:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error connecting to Replicate API:', error);
  }
  
  // Check if we can access the models
  console.log('\nChecking access to models:');
  
  for (const model of videoModels) { // Renamed variable
    try {
      const response = await fetch(`https://api.replicate.com/v1/models/${model.id}`, {
        headers: {
          Authorization: `Token ${apiToken}`,
        },
      });
      
      if (response.ok) {
        console.log(`✅ Model ${model.id} is accessible`);
        
        // Check if the version exists
        const versionResponse = await fetch(`https://api.replicate.com/v1/models/${model.id}/versions/${model.version}`, {
          headers: {
            Authorization: `Token ${apiToken}`,
          },
        });
        
        if (versionResponse.ok) {
          console.log(`  ✅ Version ${model.version} exists`);
        } else {
          console.error(`  ❌ Version ${model.version} does not exist or is not accessible`);
        }
      } else {
        console.error(`❌ Model ${model.id} is not accessible:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error checking model ${model.id}:`, error);
    }
  }
}

checkReplicateAccess().catch(console.error);
