/**
 * This script updates the model versions in the video-models.ts file
 * Run it with: npx tsx scripts/update-model-versions.ts
 */

import { fetchLatestModelVersion } from '../lib/replicate/fetch-model-versions';
import { videoModels } from '../lib/replicate/video-models'; // Renamed import
import * as fs from 'fs';
import * as path from 'path';

async function updateModelVersions() {
  console.log('Updating model versions...');
  
  // Get unique model IDs
  const modelIds = [...new Set(videoModels.map(model => model.id))]; // Renamed variable
  
  // Fetch latest versions
  const updates: Record<string, string> = {};
  
  for (const modelId of modelIds) {
    console.log(`Fetching latest version for ${modelId}...`);
    const version = await fetchLatestModelVersion(modelId);
    if (version) {
      updates[modelId] = version;
      console.log(`Latest version of ${modelId}: ${version}`);
    } else {
      console.log(`Could not fetch latest version of ${modelId}`);
    }
  }
  
  // Update the file
  const filePath = path.join(process.cwd(), 'lib/replicate/video-models.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace versions in the file
  for (const [modelId, version] of Object.entries(updates)) {
    const escapedModelId = modelId.replace(/\//g, '\\/');
    // Updated regex to not look for provider
    const regex = new RegExp(`id: "${escapedModelId}",[\\s\\n]*name: "[^"]+",\\s*\\n\\s*version: "[^"]+"`, 'g');
    // Removed provider from replacement string
    content = content.replace(regex, `id: "${modelId}",\n    name: "${videoModels.find(m => m.id === modelId)?.name || ''}",\n    version: "${version}"`);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Model versions updated successfully!');
}

updateModelVersions().catch(console.error);
