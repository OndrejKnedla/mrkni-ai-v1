import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the Replicate API token
    const replicateApiToken = process.env.REPLICATE_API_TOKEN
    
    // Check if the token exists
    if (!replicateApiToken) {
      return NextResponse.json({ 
        error: "Replicate API token is not set",
        exists: false,
        length: 0
      }, { status: 500 })
    }
    
    // Test the token by making a simple API call
    const response = await fetch("https://api.replicate.com/v1/models", {
      headers: {
        Authorization: `Token ${replicateApiToken}`,
      },
    })
    
    // Check if the API call was successful
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: `API Error: ${error.detail || response.statusText}`,
        exists: true,
        length: replicateApiToken.length,
        status: response.status,
        valid: false
      }, { status: 200 })
    }
    
    // Return success
    return NextResponse.json({ 
      success: true,
      exists: true,
      length: replicateApiToken.length,
      status: response.status,
      valid: true,
      message: "Replicate API token is valid"
    }, { status: 200 })
  } catch (error) {
    console.error("Error testing Replicate API token:", error)
    return NextResponse.json({ 
      error: "Error testing Replicate API token",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
