import { NextResponse } from "next/server"
import { videoModels } from "@/lib/replicate/video-models" // Renamed import

export async function GET(request: Request) {
  try {
    // Get the Replicate API token
    const replicateApiToken = process.env.REPLICATE_API_TOKEN
    if (!replicateApiToken) {
      return NextResponse.json({ error: "Replicate API token is not set" }, { status: 500 })
    }

    // Get the model ID from the query parameters
    const url = new URL(request.url)
    const modelId = url.searchParams.get("modelId")

    // If no model ID is provided, check all models
    const modelsToCheck = modelId 
      ? videoModels.filter(model => model.id === modelId) // Renamed variable
      : videoModels // Renamed variable

    if (modelsToCheck.length === 0) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    // Check each model
    const results = await Promise.all(
      modelsToCheck.map(async (model) => {
        try {
          // Check if the model exists
          const modelResponse = await fetch(`https://api.replicate.com/v1/models/${model.id}`, {
            headers: {
              Authorization: `Token ${replicateApiToken}`,
            },
          })

          if (!modelResponse.ok) {
            return {
              id: model.id,
              name: model.name,
              available: false,
              error: "Model not found",
              supportsTextToVideo: model.supportsTextToVideo,
              supportsImageToVideo: model.supportsImageToVideo,
            }
          }

          // Check if the version exists
          const versionResponse = await fetch(`https://api.replicate.com/v1/models/${model.id}/versions/${model.version}`, {
            headers: {
              Authorization: `Token ${replicateApiToken}`,
            },
          })

          if (!versionResponse.ok) {
            // Try to get the latest version
            const modelData = await modelResponse.json()
            const latestVersion = modelData.latest_version?.id

            return {
              id: model.id,
              name: model.name,
              available: false,
              error: "Version not found",
              latestVersion,
              supportsTextToVideo: model.supportsTextToVideo,
              supportsImageToVideo: model.supportsImageToVideo,
            }
          }

          return {
            id: model.id,
            name: model.name,
            available: true,
            supportsTextToVideo: model.supportsTextToVideo,
            supportsImageToVideo: model.supportsImageToVideo,
          }
        } catch (error) {
          console.error(`Error checking model ${model.id}:`, error)
          return {
            id: model.id,
            name: model.name,
            available: false,
            error: "Error checking model",
            supportsTextToVideo: model.supportsTextToVideo,
            supportsImageToVideo: model.supportsImageToVideo,
          }
        }
      })
    )

    // Return the results
    return NextResponse.json({
      models: results,
      textToVideoModels: results.filter(model => model.available && model.supportsTextToVideo),
      imageToVideoModels: results.filter(model => model.available && model.supportsImageToVideo),
    })
  } catch (error) {
    console.error("Error checking video models:", error)
    return NextResponse.json({ error: "Error checking video models" }, { status: 500 })
  }
}
