import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the image URL from the query parameters
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")

    if (!imageUrl) {
      console.error("Image proxy error: No URL provided")
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    // Decode the URL (it will be base64 encoded to avoid issues with special characters)
    let decodedUrl;
    try {
      decodedUrl = decodeURIComponent(atob(imageUrl))
      console.log(`Image proxy processing URL: ${decodedUrl}`)
    } catch (decodeError) {
      console.error("Error decoding URL:", decodeError)
      return NextResponse.json({ error: "Invalid URL encoding" }, { status: 400 })
    }

    // Validate URL format - allow http, https, and data URLs
    if (!decodedUrl.startsWith('http') && !decodedUrl.startsWith('data:')) {
      console.error(`Invalid URL format: ${decodedUrl}`)
      // Try to fix the URL by adding https:// if it's missing
      if (!decodedUrl.includes('://')) {
        decodedUrl = 'https://' + decodedUrl;
        console.log(`Attempting to fix URL by adding https://: ${decodedUrl}`);
      } else {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
      }
    }

    // Log the URL we're about to fetch
    console.log(`Image proxy attempting to fetch: ${decodedUrl}`)

    // Fetch the image
    const response = await fetch(decodedUrl, {
      headers: {
        // Add headers that might help with CORS issues
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText} for URL: ${decodedUrl}`)
      return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status })
    }

    // Get the image data and content type
    const imageData = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    console.log(`Successfully proxied image: ${decodedUrl} (${contentType}, ${imageData.byteLength} bytes)`)

    // Return the image with the correct content type
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error("Error in image proxy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
