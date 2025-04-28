import { NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";

// Ensure Replicate API Token is set
const replicateApiToken = process.env.REPLICATE_API_TOKEN;
if (!replicateApiToken) {
  console.error("Missing REPLICATE_API_TOKEN environment variable.");
}

export async function GET(request: Request) {
  try {
    // 1. Check authentication
    const supabase = createServerActionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get prediction ID from query parameters
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get("id");

    if (!predictionId) {
      return NextResponse.json(
        { error: "Prediction ID is required" },
        { status: 400 }
      );
    }

    // Ensure token is available
    if (!replicateApiToken) {
        throw new Error("Server configuration error: Replicate API Token missing.");
    }

    // 3. Fetch prediction status from Replicate
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${replicateApiToken}`,
        },
        cache: 'no-store', // Ensure fresh status is fetched
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Replicate Status Check Error:", error);
      return NextResponse.json(
        { error: error.detail || "Failed to fetch generation status" },
        { status: response.status }
      );
    }

    const result = await response.json();

    // 4. Optionally update database status (if needed, using service client)
    // const supabaseServiceClient = createClient(...) // If needed
    // await supabaseServiceClient.from('image_generations').update({ status: result.status, output_urls: result.output }).eq('replicate_id', predictionId)

    // 5. Return the full prediction result from Replicate
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error in /api/image-status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
