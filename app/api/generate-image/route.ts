import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"
import { createClient } from '@supabase/supabase-js' // Import standard client creator
import { modelConfig, getModelById, type ModelTier } from "@/lib/config" // Import ModelTier
import type { GenerationParams } from "@/lib/types"

// Define the bucket name for storing generated images
const STORAGE_BUCKET_NAME = 'generated-images'

// Maximum number of polling attempts before giving up
const MAX_POLLING_ATTEMPTS = 30

// Delay between polling attempts in milliseconds (5 seconds)
const POLLING_DELAY = 5000

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.")
  // Optionally throw an error or handle appropriately during server startup
}

/**
 * Process an image generation by polling for completion and storing the result in Supabase Storage.
 * This function is designed to run in the background after the initial API response.
 */
async function processImageGeneration(
  predictionId: string,
  userId: string,
  supabaseServiceClient: any, // Use any type to avoid TypeScript issues
  modelName: string // Keep for future use even if not currently used
): Promise<void> {
  console.log(`Starting background processing for generation ${predictionId}`);

  // Check if the storage bucket exists, create it if it doesn't
  const { data: buckets } = await supabaseServiceClient.storage.listBuckets();
  const bucketExists = buckets?.some((bucket: any) => bucket.name === STORAGE_BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating storage bucket: ${STORAGE_BUCKET_NAME}`);
    const { error: bucketError } = await supabaseServiceClient.storage.createBucket(STORAGE_BUCKET_NAME, {
      public: true // Make the bucket public for easier access
    });

    if (bucketError) {
      console.error(`Error creating storage bucket: ${bucketError.message}`);
      throw new Error(`Failed to create storage bucket: ${bucketError.message}`);
    }
  }

  // Poll for completion
  let attempts = 0;
  let finalResult = null;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    attempts++;

    try {
      // Fetch the current status from Replicate
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
        cache: 'no-store', // Ensure fresh status is fetched
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Polling error for generation ${predictionId}:`, error);
        // If we get a 404 or 5xx, stop polling
        if (response.status === 404 || response.status >= 500) {
          break;
        }
        // For other errors, continue polling
        await new Promise(resolve => setTimeout(resolve, POLLING_DELAY));
        continue;
      }

      const result = await response.json();
      console.log(`Poll attempt ${attempts} for generation ${predictionId}: ${result.status}`);

      // If the generation is complete (succeeded or failed), stop polling
      if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
        finalResult = result;
        break;
      }

      // Wait before the next poll
      await new Promise(resolve => setTimeout(resolve, POLLING_DELAY));
    } catch (error: any) {
      console.error(`Error polling generation ${predictionId}:`, error.message);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, POLLING_DELAY));
    }
  }

  // If we didn't get a final result, log an error and exit
  if (!finalResult) {
    console.error(`Failed to get final result for generation ${predictionId} after ${attempts} attempts`);
    return;
  }

  // If the generation failed, update the database and exit
  if (finalResult.status !== 'succeeded' || !finalResult.output || !Array.isArray(finalResult.output) || finalResult.output.length === 0) {
    console.log(`Generation ${predictionId} ${finalResult.status}, no images to process`);
    // Update the status in the database
    await supabaseServiceClient.from("image_generations").update({
      status: finalResult.status,
      error: finalResult.error || 'No output images'
    }).eq("id", predictionId);
    return;
  }

  // Process each output image
  const permanentUrls: string[] = [];

  for (let i = 0; i < finalResult.output.length; i++) {
    const imageUrl = finalResult.output[i];
    const imageIndex = i + 1;

    try {
      // Download the image from the temporary URL
      console.log(`Downloading image ${imageIndex} for generation ${predictionId}`);
      const imageResponse = await fetch(imageUrl);

      if (!imageResponse.ok) {
        console.error(`Failed to download image ${imageIndex} for generation ${predictionId}: ${imageResponse.status}`);
        continue;
      }

      // Get the image as a blob
      const imageBlob = await imageResponse.blob();

      // Determine the file extension based on content type
      let fileExtension = 'webp'; // Default extension
      const contentType = imageResponse.headers.get('content-type');

      if (contentType) {
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          fileExtension = 'jpg';
        } else if (contentType.includes('png')) {
          fileExtension = 'png';
        } else if (contentType.includes('svg')) {
          fileExtension = 'svg';
        }
      }

      // Create a unique file path in the format: userId/predictionId_index.ext
      const filePath = `${userId}/${predictionId}_${imageIndex}.${fileExtension}`;

      // Upload the image to Supabase Storage
      console.log(`Uploading image ${imageIndex} to Supabase Storage: ${filePath}`);
      const { error: uploadError } = await supabaseServiceClient.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(filePath, imageBlob, {
          contentType: imageBlob.type,
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        console.error(`Error uploading image ${imageIndex} for generation ${predictionId}:`, uploadError);
        continue;
      }

      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabaseServiceClient.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(filePath);

      let permanentImageUrl = publicUrlData.publicUrl;

      // Ensure the URL has https:// prefix
      if (permanentImageUrl && !permanentImageUrl.startsWith('http')) {
        console.log(`Adding https:// prefix to Supabase URL: ${permanentImageUrl}`);
        permanentImageUrl = `https://${permanentImageUrl}`;
      }

      // Log the URL details for debugging
      console.log(`Image ${imageIndex} URL details:`);
      console.log(`- Original URL: ${publicUrlData.publicUrl}`);
      console.log(`- Final URL: ${permanentImageUrl}`);
      console.log(`- Contains 'supabase.co': ${permanentImageUrl.includes('supabase.co')}`);
      console.log(`- Contains 'storage/v1/object/public': ${permanentImageUrl.includes('storage/v1/object/public')}`);

      permanentUrls.push(permanentImageUrl);

      console.log(`Image ${imageIndex} for generation ${predictionId} stored at: ${permanentImageUrl}`);
    } catch (error: any) {
      console.error(`Error processing image ${imageIndex} for generation ${predictionId}:`, error.message);
    }
  }

  // If we successfully stored any images, save them to the database
  if (permanentUrls.length > 0) {
    try {
      // First, delete any existing images for this generation
      await supabaseServiceClient.from("generated_images").delete().eq("generation_id", predictionId);

      // Insert the new permanent URLs
      const imageInserts = permanentUrls.map(url => ({
        generation_id: predictionId,
        image_url: url,
      }));

      const { error: insertError } = await supabaseServiceClient.from("generated_images").insert(imageInserts);

      if (insertError) {
        console.error(`Error inserting permanent URLs for generation ${predictionId}:`, insertError);
      } else {
        console.log(`Successfully saved ${permanentUrls.length} permanent URLs for generation ${predictionId}`);

        // Update the status in the image_generations table
        await supabaseServiceClient.from("image_generations").update({
          status: 'succeeded'
        }).eq("id", predictionId);
      }
    } catch (error: any) {
      console.error(`Error saving permanent URLs for generation ${predictionId}:`, error.message);
    }
  } else {
    console.error(`No permanent URLs were created for generation ${predictionId}`);

    // Update the status to indicate failure
    await supabaseServiceClient.from("image_generations").update({
      status: 'failed',
      error: 'Failed to store images permanently'
    }).eq("id", predictionId);
  }
}

export async function POST(request: Request) {
  console.log("Generate image API route called");
  try {
    // 1. Check authentication using the standard server client
    const supabaseUserClient = createServerActionClient()
    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Create Service Role Client to bypass RLS for subscription check
    // Ensure correct env vars are available
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server configuration error: Supabase URL or Service Key missing.");
    }
    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            // Required for service role client
            autoRefreshToken: false,
            persistSession: false
        }
    });


    // 3. Check subscription status and credits using the Service Role Client
    // First, check if user has an active subscription
    const { data: subscription } = await supabaseServiceClient
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()
    // Note: We don't need to check for errors here as we'll default to free tier if no subscription is found

    // Get user's credits
    let credits = null;
    try {
      const { data, error } = await supabaseServiceClient
        .from("credits")
        .select("image_credits, video_credits")
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching credits:", error)

        // If no credits record exists, create one
        if (error.code === "PGRST116") { // No rows returned
          console.log("No credits record found, creating one...")

          // Create a new credits record for the user
          const { data: newCredits, error: insertError } = await supabaseServiceClient
            .from("credits")
            .insert({
              user_id: user.id,
              image_credits: 5, // Free tier: 5 image credits
              video_credits: 0, // Free tier: 0 video credits
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (insertError) {
            console.error("Error creating credits record:", insertError)
            return NextResponse.json({ error: "Failed to create credits record." }, { status: 500 })
          }

          credits = newCredits;
        } else {
          // For other errors, return an error response
          return NextResponse.json({ error: "Failed to verify credits." }, { status: 500 })
        }
      } else {
        credits = data;
      }
    } catch (error) {
      console.error("Exception fetching credits:", error)
      return NextResponse.json({ error: "Failed to verify credits." }, { status: 500 })
    }

    // Check if user has enough credits
    if (!credits || credits.image_credits < 1) {
      return NextResponse.json({
        error: "Insufficient image credits. Please upgrade your subscription or wait for your credits to renew.",
        credits: credits?.image_credits || 0
      }, { status: 403 })
    }

    // Determine user's tier (from subscription or default to free)
    const userTier = subscription?.tier || "free"

    const params: GenerationParams = await request.json()

    // Validate parameters
    if (!params.prompt && !params.image) { // Require prompt OR image
      return NextResponse.json({ error: "Prompt or Image is required" }, { status: 400 })
    }
    if (!params.model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 })
    }

    // Get model details from config
    const selectedModel = getModelById(params.model)
    if (!selectedModel) {
      return NextResponse.json({ error: "Invalid model selected" }, { status: 400 })
    }

    // Check if the user's subscription tier allows access to the selected model tier
    const tierLevels: Record<ModelTier, number> = { free: 0, basic: 1, premium: 2 }
    const userTierLevel = tierLevels[userTier as ModelTier]
    const modelTierLevel = tierLevels[selectedModel.tier]

    // Check tier access
    if (modelTierLevel > userTierLevel) {
      // Specific error for insufficient tier
      return NextResponse.json({
        error: `Your current tier ('${userTier}') does not permit use of the '${selectedModel.name}' model ('${selectedModel.tier}' tier required). Please upgrade your subscription.`,
        tier: userTier,
        requiredTier: selectedModel.tier
      }, { status: 403 })
    }


    // Prepare the input for Replicate API
    const replicateInput: any = {
      prompt: params.prompt || "", // Use empty prompt if only image is provided
      negative_prompt: params.negative_prompt || "",
      width: params.width || 512,
      height: params.height || 512,

      // Handle steps with model-specific limits
      num_inference_steps: params.num_inference_steps || selectedModel.defaultSteps || modelConfig.defaultSteps,

      guidance_scale: params.guidance_scale || modelConfig.defaultGuidance,
      num_outputs: params.num_images || modelConfig.defaultNumImages, // Replicate uses num_outputs
      scheduler: params.scheduler || modelConfig.schedulers[0].value,
      seed: params.seed || Math.floor(Math.random() * 1000000),
    }

    // Apply model-specific parameter limits
    if (selectedModel.additionalParams?.maxSteps && replicateInput.num_inference_steps > selectedModel.additionalParams.maxSteps) {
      console.log(`Limiting steps to ${selectedModel.additionalParams.maxSteps} for model ${selectedModel.name}`)
      replicateInput.num_inference_steps = selectedModel.additionalParams.maxSteps
    }

    // Add image if provided (assuming it's a base64 data URL)
    if (params.image) {
      // Switch back to trying 'image' as the parameter name
      replicateInput.image = params.image;
      // Use 'prompt_strength', try a moderate value for image influence
      replicateInput.prompt_strength = 0.7;
      // Set lower steps for image-to-image
      replicateInput.num_inference_steps = 20; // Lower step count for img2img
      // Also lower guidance scale for img2img
      replicateInput.guidance_scale = 5.0;
    }

    // Prepare the full request body for Replicate
    const body = {
      version: selectedModel.id, // *** Use the model ID (owner/name) instead of the hash ***
      input: replicateInput,
      // Add webhook if needed for status updates
      // webhook: `${process.env.NEXT_PUBLIC_SITE_URL}/api/replicate-webhook`,
      // webhook_events_filter: ["completed"]
    }

    // Call Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`, // Ensure this env var is set
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Replicate API Error:", error)
      return NextResponse.json({ error: error.detail || "Failed to start image generation" }, { status: response.status })
    }

    const initialResult = await response.json()

    // Decrement image credit - only deduct 1 credit per generation request, regardless of num_images
    const { data: creditResult, error: creditError } = await supabaseServiceClient.rpc(
      'decrement_image_credit',
      { p_user_id: user.id }
    )

    if (creditError) {
      console.error("Error decrementing credit:", creditError)
      // Don't fail the request if credit deduction fails, but log it
    } else if (creditResult === false) {
      console.warn("Credit deduction returned false for user", user.id)
    }

    // First, check if the image_generations table exists and has the correct structure
    try {
      // Try to get the column types of the image_generations table
      const { data: columnData, error: columnError } = await supabaseServiceClient.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'image_generations'
          AND table_schema = 'public'
          AND column_name = 'id'
        `
      });

      // If there's an error or the id column is not TEXT, we need to fix the table
      if (columnError || (columnData && columnData.length > 0 && columnData[0].data_type !== 'text')) {
        console.log("Fixing image_generations table to accept string IDs...");

        // First, check if we need to drop the foreign key constraint in generated_images
        await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            -- Drop the foreign key constraint if it exists
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'generated_images_generation_id_fkey'
                AND table_name = 'generated_images'
              ) THEN
                ALTER TABLE public.generated_images DROP CONSTRAINT generated_images_generation_id_fkey;
              END IF;
            END
            $$;
          `
        });

        // Now create a new temporary table with the correct structure
        await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            -- Create a new temporary table with text id
            CREATE TABLE IF NOT EXISTS public.image_generations_new (
              id TEXT PRIMARY KEY,
              user_id UUID NOT NULL,
              prompt TEXT NOT NULL,
              negative_prompt TEXT,
              width INTEGER NOT NULL,
              height INTEGER NOT NULL,
              steps INTEGER NOT NULL,
              guidance_scale NUMERIC NOT NULL,
              scheduler TEXT NOT NULL,
              seed BIGINT,
              model TEXT,
              status TEXT,
              error TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            );

            -- Rename tables
            DROP TABLE IF EXISTS public.image_generations_old;

            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'image_generations'
                AND table_schema = 'public'
              ) THEN
                ALTER TABLE public.image_generations RENAME TO image_generations_old;
              END IF;
            END
            $$;

            ALTER TABLE public.image_generations_new RENAME TO image_generations;

            -- Create indexes and RLS policies
            CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON public.image_generations(user_id);

            ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

            -- Drop existing policies if they exist
            DROP POLICY IF EXISTS "Users can view their own image generations" ON public.image_generations;
            DROP POLICY IF EXISTS "Service role can manage all image generations" ON public.image_generations;

            -- Create new policies
            CREATE POLICY "Users can view their own image generations"
              ON public.image_generations FOR SELECT
              USING (auth.uid() = user_id);

            CREATE POLICY "Service role can manage all image generations"
              ON public.image_generations FOR ALL
              USING (true);
          `
        });

        // Now fix the generated_images table to use TEXT for generation_id
        await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            -- Create a new temporary table with text generation_id
            CREATE TABLE IF NOT EXISTS public.generated_images_new (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              generation_id TEXT NOT NULL,
              image_url TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            );

            -- Rename tables
            DROP TABLE IF EXISTS public.generated_images_old;

            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'generated_images'
                AND table_schema = 'public'
              ) THEN
                ALTER TABLE public.generated_images RENAME TO generated_images_old;
              END IF;
            END
            $$;

            ALTER TABLE public.generated_images_new RENAME TO generated_images;

            -- Create indexes and RLS policies
            CREATE INDEX IF NOT EXISTS idx_generated_images_generation_id ON public.generated_images(generation_id);

            ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

            -- Drop existing policies if they exist
            DROP POLICY IF EXISTS "Users can view their own generated images" ON public.generated_images;
            DROP POLICY IF EXISTS "Service role can manage all generated images" ON public.generated_images;

            -- Create new policies
            CREATE POLICY "Users can view their own generated images"
              ON public.generated_images FOR SELECT
              USING (
                EXISTS (
                  SELECT 1 FROM public.image_generations
                  WHERE id = generation_id AND user_id = auth.uid()
                )
              );

            CREATE POLICY "Service role can manage all generated images"
              ON public.generated_images FOR ALL
              USING (true);
          `
        });
      }
    } catch (error: any) {
      console.error("Error checking/fixing table structure:", error.message);
      // Continue anyway, as we'll try to insert the record
    }

    // Save initial record to database (using Service Client to bypass potential RLS on insert)
    const { error: dbError } = await supabaseServiceClient.from("image_generations").insert({
      status: 'processing', // Add status field to indicate processing
      id: initialResult.id, // Use Replicate's prediction ID as our record ID
      user_id: user.id,
      prompt: params.prompt, // Store original prompt
      negative_prompt: params.negative_prompt,
      width: replicateInput.width, // Use width from replicateInput
      height: replicateInput.height, // Use height from replicateInput
      steps: replicateInput.num_inference_steps, // Use steps from replicateInput
      guidance_scale: replicateInput.guidance_scale, // Use guidance from replicateInput
      scheduler: replicateInput.scheduler, // Use scheduler from replicateInput
      seed: replicateInput.seed, // Use seed from replicateInput
      // Note: We are not storing the input image in the DB currently
      model: selectedModel.name, // Store the human-readable model name instead of just the ID
    }).select().single()

    if (dbError) {
        console.error("Database Insert Error:", dbError)
        // Decide how to handle: maybe still return success to user but log error?
        // For now, return an error
        return NextResponse.json({ error: "Failed to save generation record" }, { status: 500 })
    }

    // Return the initial prediction details to the client
    // This allows the client to start polling for status updates
    const initialResponse = {
      id: initialResult.id,
      status: initialResult.status,
      model: selectedModel.name, // Include the human-readable model name
    }

    // Start a background process to poll for completion and store images
    // We don't await this, so the API can return immediately
    processImageGeneration(initialResult.id, user.id, supabaseServiceClient, selectedModel.name)
      .catch(error => console.error(`Background processing error for generation ${initialResult.id}:`, error))

    // Return the initial prediction details
    return NextResponse.json(initialResponse)

  } catch (error: any) {
    console.error("Error in /api/generate-image:", error)
    // Ensure specific error messages from earlier checks are preserved if they exist
    const message = error.message || "Internal server error";
    // Attempt to get status if it's a thrown response or default to 500
    const status = (error instanceof NextResponse || (error.response && typeof error.response.status === 'number'))
                   ? (error.response?.status ?? 500)
                   : 500;
    // Avoid returning generic 500 if a specific 4xx was thrown
    return NextResponse.json({ error: message }, { status: status })
  }
}
