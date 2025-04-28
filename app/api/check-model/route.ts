import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the model ID and version from the query parameters
    const url = new URL(request.url)
    const modelId = url.searchParams.get("modelId")
    const version = url.searchParams.get("version")

    if (!modelId || !version) {
      return NextResponse.json({ error: "Model ID and version are required" }, { status: 400 })
    }

    // Check if the Replicate API token is set
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "Replicate API token is not set" }, { status: 500 })
    }

    // Check if the model exists
    const modelResponse = await fetch(`https://api.replicate.com/v1/models/${modelId}`, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    })

    if (!modelResponse.ok) {
      return NextResponse.json({ available: false, error: "Model not found" }, { status: 200 })
    }

    // Check if the version exists
    const versionResponse = await fetch(`https://api.replicate.com/v1/models/${modelId}/versions/${version}`, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    })

    if (!versionResponse.ok) {
      return NextResponse.json({ available: false, error: "Version not found" }, { status: 200 })
    }

    // If both the model and version exist, return success
    return NextResponse.json({ available: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error checking model availability:", error)
    return NextResponse.json({ available: false, error: error.message || "Internal server error" }, { status: 200 })
  }
}
