/**
 * This utility fetches the latest model versions from Replicate
 * It can be used to update the model versions in the video-models.ts file
 */

import 'server-only';

interface ReplicateModelVersion {
  id: string;
  created_at: string;
  cog_version: string;
  openapi_schema: any;
}

interface ReplicateModelResponse {
  id: string;
  owner: string;
  name: string;
  description: string;
  visibility: string;
  github_url: string;
  paper_url: string | null;
  license_url: string | null;
  run_count: number;
  cover_image_url: string | null;
  default_example: any;
  latest_version: ReplicateModelVersion;
}

/**
 * Fetches the latest version of a Replicate model
 * @param modelId The model ID in the format "owner/model"
 * @returns The version ID or null if not found
 */
export async function fetchLatestModelVersion(modelId: string): Promise<string | null> {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN is not set');
    return null;
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/models/${modelId}`, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error fetching model ${modelId}:`, error);
      return null;
    }

    const data = await response.json() as ReplicateModelResponse;
    return data.latest_version?.id || null;
  } catch (error) {
    console.error(`Error fetching model ${modelId}:`, error);
    return null;
  }
}

/**
 * Updates the model version in the video-models.ts file
 * This is a utility function that can be called from a script
 * @param modelId The model ID in the format "owner/model"
 */
export async function updateModelVersion(modelId: string): Promise<void> {
  const version = await fetchLatestModelVersion(modelId);
  if (version) {
    console.log(`Latest version of ${modelId}: ${version}`);
  } else {
    console.log(`Could not fetch latest version of ${modelId}`);
  }
}
