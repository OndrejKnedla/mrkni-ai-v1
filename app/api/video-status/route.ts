import { NextResponse } from "next/server";
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const replicateApiToken = process.env.REPLICATE_API_TOKEN;

export async function GET(request: Request) {
  // Use a try-catch block for overall error handling
  try {
    // --- Authentication Check (Optional but recommended) ---
    // You might want to add authentication here to ensure only the user
    // who started the generation can check its status.
    // For simplicity now, we'll skip direct user auth check in this status endpoint,
    // assuming the prediction ID itself is the primary identifier.
    // Consider adding auth later if needed.

    // --- Get Prediction ID from Query Params ---
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get("id");

    if (!predictionId) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 });
    }

    // --- Check Replicate API Token ---
    if (!replicateApiToken) {
        console.error("Replicate API token is not configured.");
        return NextResponse.json({ error: "Server configuration error: Replicate token missing." }, { status: 500 });
    }

    // --- Fetch Prediction Status from Replicate ---
    console.log(`Checking status for prediction ID: ${predictionId}`);
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${replicateApiToken}`,
      },
      cache: 'no-store', // Ensure fresh status
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Replicate status check error for ${predictionId}:`, errorData);
      const errorMessage = errorData.detail || errorData.title || "Failed to get prediction status";
      // Don't treat 404 as a server error, just means prediction not found (maybe expired?)
      const status = response.status === 404 ? 404 : 500;
      return NextResponse.json({ error: errorMessage }, { status });
    }

    const result = await response.json();
    console.log(`Status for ${predictionId}: ${result.status}`);

    // --- Update Database if Succeeded ---
    if (result.status === 'succeeded' && result.output) {
        // Initialize Service Role Client only if needed for DB update
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error("Database update skipped: Supabase URL or Service Key missing.");
        } else {
            try {
                const supabaseServiceClient = createServiceRoleClient(supabaseUrl, supabaseServiceKey, {
                  auth: { autoRefreshToken: false, persistSession: false }
                });

                // Extract the video URL (assuming it's the first element if output is an array)
                const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;

                if (typeof videoUrl === 'string') {
                    console.log(`Updating database for successful prediction ${predictionId}`);
                    const { error: updateError } = await supabaseServiceClient
                      .from("video_generations")
                      .update({
                        status: 'succeeded',
                        output_url: videoUrl, // Save the video URL
                        // updated_at: new Date().toISOString(), // Optionally update timestamp
                      })
                      .eq("replicate_id", predictionId); // Match on replicate_id

                    if (updateError) {
                      // Log the full error object for more details
                      console.error(`Error updating video_generations table for ${predictionId}:`, JSON.stringify(updateError, null, 2));
                      // Log error but still return success status to client
                    } else {
                      console.log(`Successfully updated database for prediction ${predictionId}`);
                    }
                } else {
                     console.warn(`Prediction ${predictionId} succeeded but output URL is not a string:`, videoUrl);
                     // Optionally update status to failed if URL is missing/invalid
                }
            } catch (dbError: any) {
                // Log the full error object for more details
                console.error(`Database exception during update for ${predictionId}:`, JSON.stringify(dbError, null, 2));
                // Log error but still return success status to client
            }
        }
    } else if (result.status === 'failed' || result.status === 'canceled') {
         // Optionally update DB status for failed/canceled jobs here too
         // Similar DB update logic as above, setting status and error fields
         console.log(`Prediction ${predictionId} ended with status: ${result.status}`);
    }

    // --- Return Replicate Status ---
    return NextResponse.json({
      id: result.id,
      status: result.status,
      output: result.output, // Include output URL if available
      error: result.error,   // Include error if available
    });

  } catch (error: any) {
    console.error("Error in /api/video-status:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
