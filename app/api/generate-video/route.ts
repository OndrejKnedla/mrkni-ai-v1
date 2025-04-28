import { NextResponse } from "next/server";
// Import the custom server client helper
import { createServerActionClient } from '@/lib/supabase/server';
// Use defaultVideoModel for model info
import { defaultVideoModel } from "@/lib/replicate/video-models";
// cookies import is removed as the helper handles it
// Import createClient from supabase-js for the service role client
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  // Use a try-catch block for overall error handling
  try {
    // --- Initialize Service Role Client (needed for auth check and DB ops) ---
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Server configuration error: Supabase URL or Service Key missing.");
      throw new Error("Server configuration error."); // Throw generic error
    }
    const supabaseServiceClient = createServiceRoleClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    // --- End Service Client Init ---

    // --- Authentication Check using Bearer Token and Service Client ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Verify the token using the service role client
    const { data: { user }, error: authError } = await supabaseServiceClient.auth.getUser(token);

    if (authError || !user) {
        console.error("Auth Error verifying token:", authError);
        return NextResponse.json({ error: authError?.message || "Unauthorized: Invalid token" }, { status: 401 });
    }
    // --- End Authentication Check ---


    // --- Credit Check (using Service Client) --- - No change needed here
    let credits = null;
    try {
      const { data, error } = await supabaseServiceClient
        .from("credits")
        .select("image_credits, video_credits")
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching credits:", error)
        // If no credits record exists, treat as 0 credits (don't create here)
        if (error.code === "PGRST116") {
            console.log("No credits record found for user:", user.id);
            credits = { image_credits: 0, video_credits: 0 };
        } else {
            // For other errors, return an error response
            return NextResponse.json({ error: "Failed to verify credits." }, { status: 500 });
        }
      } else {
        credits = data;
      }
    } catch (error) {
      console.error("Exception fetching credits:", error)
      return NextResponse.json({ error: "Failed to verify credits." }, { status: 500 })
    }

    // Check if user has enough video credits
    if (!credits || credits.video_credits < 1) {
      return NextResponse.json({
        error: "Insufficient video credits. Please upgrade your subscription or wait for your credits to renew.",
        credits: credits?.video_credits || 0
      }, { status: 403 })
    }
    // --- End Credit Check ---

    // Get parameters from request body
    const params = await request.json();

    // Validate required prompt
    if (!params.prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // --- Prepare Replicate API Input for Luma Model ---
    const replicateInput: Record<string, any> = {
      prompt: params.prompt,
      duration: 5, // Changed fixed duration to 5 seconds
      aspect_ratio: params.aspect_ratio || "16:9", // Use aspect_ratio from request or default
    };

    // Add optional parameters if they exist in the request
    if (params.negative_prompt) replicateInput.negative_prompt = params.negative_prompt;
    if (params.start_image_url) replicateInput.start_image_url = params.start_image_url;
    if (params.end_image_url) replicateInput.end_image_url = params.end_image_url;
    if (params.seed) replicateInput.seed = params.seed;
    else replicateInput.seed = Math.floor(Math.random() * 1000000); // Default random seed
    if (params.guidance_scale) replicateInput.guidance_scale = params.guidance_scale;
    else if (defaultVideoModel.default_params?.guidance_scale) {
        replicateInput.guidance_scale = defaultVideoModel.default_params.guidance_scale; // Use model default
    }

    // --- Fetch Latest Model Version from Replicate ---
    let latestVersionId = null;
    try {
      console.log(`Fetching latest version for model: ${defaultVideoModel.id}`);
      const modelResponse = await fetch(`https://api.replicate.com/v1/models/${defaultVideoModel.id}`, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      if (!modelResponse.ok) {
        const errorText = await modelResponse.text();
        console.error(`Failed to fetch model details: ${modelResponse.status}`, errorText);
        throw new Error(`Could not fetch model details from Replicate (Status: ${modelResponse.status})`);
      }

      const modelData = await modelResponse.json();
      if (modelData.latest_version?.id) {
        latestVersionId = modelData.latest_version.id;
        console.log(`Found latest version ID: ${latestVersionId}`);
      } else {
        console.error("Could not find latest_version.id in model data:", modelData);
        throw new Error("Could not determine the latest model version from Replicate.");
      }
    } catch (fetchError: any) {
      console.error("Error fetching model version:", fetchError);
      return NextResponse.json({ error: `Failed to get model version: ${fetchError.message}` }, { status: 500 });
    }
    // --- End Fetch Latest Model Version ---


    // Prepare the full request body for Replicate using the fetched version
    const body = {
      version: latestVersionId, // Use the fetched version
      input: replicateInput,
    };

    // Log the request details (including the fetched version)
    console.log(`=== MAKING REQUEST TO REPLICATE API ===`);
    console.log(`Model: ${defaultVideoModel.id}`);
    console.log(`Version (fetched): ${latestVersionId}`); // Log the fetched version
    console.log(`Prompt: ${params.prompt}`);
    console.log(`API Token exists: ${!!process.env.REPLICATE_API_TOKEN}`);
    console.log(`API Token length: ${process.env.REPLICATE_API_TOKEN?.length || 0}`);
    console.log('Request body:', body); // Log the actual body being sent

    // --- Call Replicate API (using fetched version) ---
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify(body), // Send body with fetched version
    });

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Replicate API error:", errorData);
      const errorMessage = errorData.detail || errorData.title || "Failed to generate video";
      // Add specific check for version error, even though we fetched it
      if (errorMessage.toLowerCase().includes('version')) {
         return NextResponse.json({ error: `Replicate rejected the fetched version (${latestVersionId}). ${errorMessage}` }, { status: response.status });
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    // If response is OK
    const result = await response.json();

    // Log the successful initial response
    console.log(`=== REPLICATE API RESPONSE ===`);
    console.log(`Response status: ${response.status}`);
    console.log(`Prediction ID: ${result.id || 'None'}`);
    console.log(`Status: ${result.status || 'None'}`);
    console.log(`Created at: ${result.created_at || 'None'}`);
    // console.log(`Full response:`, result); // Optionally log full response

    // --- Decrement Video Credit ---
    const { data: creditResult, error: creditError } = await supabaseServiceClient.rpc(
      'decrement_video_credit',
      { p_user_id: user.id }
    )

    if (creditError) {
      console.error("Error decrementing credit:", creditError)
      // Don't fail the request if credit deduction fails, but log it
    } else if (creditResult === false) {
      console.warn("Credit deduction returned false for user", user.id)
    }

    // --- Save Initial Record to Database ---
    // Assuming 'video_generations' table exists and has appropriate columns
    try {
      const { error: insertError } = await supabaseServiceClient
        .from("video_generations")
        .insert({
          user_id: user.id,
          replicate_id: result.id, // Use the prediction ID from Replicate
          prompt: params.prompt,
          negative_prompt: params.negative_prompt || null,
          // Store fixed width/height based on 16:9 aspect ratio (e.g., 960x540)
          width: 960,
          height: 540,
          // Store fixed duration/fps if needed, or calculate num_frames
          num_frames: 5 * (defaultVideoModel.defaultFPS || 24), // Updated duration (5s) * fps
          fps: defaultVideoModel.defaultFPS || 24,
          seed: replicateInput.seed, // Save the actual seed used
          status: result.status || "processing", // Initial status from Replicate
          model_id: defaultVideoModel.id, // Save the model ID used
          // Add start/end image URLs if columns exist
          // start_image_url: params.start_image_url || null,
          // end_image_url: params.end_image_url || null,
          created_at: new Date().toISOString(), // Add created_at timestamp
        });

      if (insertError) {
        // Log the full error object for more details
        console.error("Error saving initial video generation to database:", JSON.stringify(insertError, null, 2));
        // Log but don't fail the request if DB save fails initially
      }
    } catch (dbError) {
      // Log the full error object for more details
      console.error("Exception saving video generation to database:", JSON.stringify(dbError, null, 2));
      // Log but don't fail the request
    }

    // Return the initial response from Replicate (ID and status)
    return NextResponse.json({
      id: result.id,
      status: result.status,
    });

  } catch (error: any) {
    console.error("Error in /api/generate-video:", error);
    // Return a generic server error response
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
