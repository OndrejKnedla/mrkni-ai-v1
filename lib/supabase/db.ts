import { createClient } from "./client" // Import the function
// Import necessary types for both image and video
import type { GenerationParams, HistoryItem, ImageGeneration, GeneratedImage, VideoGeneration, PromptTemplate } from "../types"
import { validateAndFixImageUrl } from "../utils/image-url-utils"

// --- User Functions ---
export async function getCurrentUser() {
  const supabase = createClient(); // Get client instance when function is called
  if (!supabase) throw new Error("Supabase client failed to initialize in getCurrentUser");
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// --- Generation History Functions (Combined Image & Video) ---

/**
 * Saves a completed generation (image or video) to the database.
 */
export async function saveGeneration(result: HistoryItem, type: 'image' | 'video') {
  const supabase = createClient(); // Get client instance
  if (!supabase) throw new Error("Supabase client failed to initialize in saveGeneration");

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated to save generation.")
  }

  console.log(`Attempting to save/update ${type.toUpperCase()} generation with ID: ${result.id}`);

  if (type === 'image') {
    // --- Upsert Image Generation Record ---
    const { data: generation, error: genError } = await supabase
      .from("image_generations")
      .upsert({
        id: result.id, user_id: user.id, prompt: result.input.prompt,
        negative_prompt: result.input.negative_prompt || null, width: result.input.width,
        height: result.input.height, steps: result.input.num_inference_steps,
        guidance_scale: result.input.guidance_scale, scheduler: result.input.scheduler,
        seed: result.input.seed || null, model: result.input.model || "unknown",
        created_at: result.created_at, status: result.status, error: result.error || null,
      }, { onConflict: 'id' })
      .select().single();

    if (genError) { console.error("Error upserting image generation record:", genError); throw genError; }
    console.log("Upserted image generation record:", generation.id);

    // --- Handle Associated Images on Upsert ---
    if (result.status === 'succeeded' && Array.isArray(result.output) && result.output.length > 0) {
      console.log(`Deleting existing associated images before upsert for generation ID: ${generation.id}`);
      const { error: deleteImgError } = await supabase.from("generated_images").delete().eq("generation_id", generation.id);
      if (deleteImgError) { console.error(`Error deleting existing images for ${generation.id}:`, deleteImgError); throw new Error(`Failed to clear existing images: ${deleteImgError.message}`); }

      const imageInserts = result.output.map((url) => ({ generation_id: generation.id, image_url: url }));
      console.log(`Attempting to insert ${imageInserts.length} associated images for generation ID: ${generation.id}`);
      const { error: imgError } = await supabase.from("generated_images").insert(imageInserts);
      if (imgError) { console.error(`Error inserting generated images for ${generation.id}:`, imgError); throw new Error(`Failed to insert associated images: ${imgError.message}`); }
      console.log(`Successfully inserted associated images for generation ID: ${generation.id}`);
    } else {
      console.log(`No output images or status not succeeded for generation ID: ${generation.id}. Deleting orphans.`);
      const { error: deleteOrphanImgError } = await supabase.from("generated_images").delete().eq("generation_id", generation.id);
      if (deleteOrphanImgError) { console.error(`Error deleting orphaned images for ${generation.id}:`, deleteOrphanImgError); }
    }
    return generation;

  } else if (type === 'video') {
    // --- Upsert Video Generation Record ---
    const { data: generation, error: genError } = await supabase
      .from("video_generations")
      .upsert({
        replicate_id: result.id, user_id: user.id, prompt: result.input.prompt,
        negative_prompt: result.input.negative_prompt || null, width: result.input.width,
        height: result.input.height, num_frames: result.input.num_frames, fps: result.input.fps,
        seed: result.input.seed || null, status: result.status || "processing",
        model_id: result.input.model || "unknown", created_at: result.created_at,
        output_url: Array.isArray(result.output) ? result.output[0] : (typeof result.output === 'string' ? result.output : null),
        error: result.error || null,
      }, { onConflict: 'replicate_id' })
      .select().single();

      if (genError) { console.error("Error upserting video generation record:", genError); throw genError; }
      console.log("Upserted video generation record:", generation.replicate_id);
      return generation;
  } else {
      console.error("Invalid type provided to saveGeneration:", type);
      throw new Error("Invalid generation type specified.");
  }
}

/**
 * Fetches combined image and video generation history for the current user.
 */
export async function getGenerationHistory(): Promise<HistoryItem[]> {
  const supabase = createClient(); // Get client instance
  if (!supabase) { console.error("Supabase client failed to initialize in getGenerationHistory"); return []; }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.log("No user found, returning empty history."); return [] }
    console.log("Fetching IMAGE and VIDEO generation history for user:", user.id);

    // --- Fetch Image Generations ---
    let imageHistoryItems: HistoryItem[] = [];
    try {
        const { data: imageGenerationsData, error: imgGenError } = await supabase
          .from("image_generations").select("*, generated_images(*)").eq("user_id", user.id).order("created_at", { ascending: false });
        if (imgGenError) { console.error("Error fetching image generations (with join):", imgGenError); }
        else if (imageGenerationsData) { imageHistoryItems = imageGenerationsData.map(convertToImageHistoryItem); }
    } catch (error) { console.error("Exception fetching image generations:", error); }

    // --- Fetch Video Generations ---
    let videoHistoryItems: HistoryItem[] = [];
     try {
        const { data: videoGenerationsData, error: vidGenError } = await supabase
          .from("video_generations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (vidGenError) { console.error("Error fetching video generations:", vidGenError); }
        else if (videoGenerationsData) { videoHistoryItems = videoGenerationsData.map(convertVideoToHistoryItem); }
    } catch (error) { console.error("Exception fetching video generations:", error); }

    // --- Combine and Sort History ---
    const combinedHistory = [...imageHistoryItems, ...videoHistoryItems];
    combinedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    console.log(`Combined history count: ${combinedHistory.length}`);
    return combinedHistory;

  } catch (error) {
    console.error('Error in getGenerationHistory:', error);
    return []; // Return empty array on error
  }
}


/**
 * Deletes a specific generation record (image or video).
 */
export async function deleteGeneration(id: string, type: 'image' | 'video') {
   const supabase = createClient(); // Get client instance
   if (!supabase) throw new Error("Supabase client failed to initialize in deleteGeneration");
   console.log(`Attempting to delete ${type} generation with ID: ${id}`);

   if (type === 'image') {
       const { error: relatedDeleteError } = await supabase.from('generated_images').delete().eq('generation_id', id);
       if (relatedDeleteError) { console.error(`Error deleting associated images:`, relatedDeleteError); }
       const { error: mainDeleteError } = await supabase.from('image_generations').delete().eq("id", id);
       if (mainDeleteError) { console.error(`Error deleting main image record ${id}:`, mainDeleteError); throw mainDeleteError; }
   } else if (type === 'video') {
       const { error: mainDeleteError } = await supabase.from('video_generations').delete().eq("replicate_id", id);
       if (mainDeleteError) { console.error(`Error deleting video record ${id}:`, mainDeleteError); throw mainDeleteError; }
   } else {
       console.error("Invalid type provided to deleteGeneration:", type);
       throw new Error("Invalid generation type specified.");
   }
   console.log(`Successfully deleted ${type} generation with ID: ${id}`);
}

// --- Prompt Template Functions ---
export async function getPromptTemplates() {
  const supabase = createClient(); // Get client instance
  if (!supabase) { console.error("Supabase client failed to initialize in getPromptTemplates"); return []; }
  const { data, error } = await supabase.from("prompt_templates").select("*").order("created_at", { ascending: false })
  if (error) { console.error("Error fetching prompt templates:", error); throw error; }
  return data || [];
}

export async function savePromptTemplate(template: Omit<PromptTemplate, "id" | "created_at">) {
  const supabase = createClient(); // Get client instance
  if (!supabase) throw new Error("Supabase client failed to initialize in savePromptTemplate");
  const { data, error } = await supabase.from("prompt_templates").insert(template).select().single()
  if (error) { console.error("Error saving prompt template:", error); throw error; }
  return data;
}

// --- Conversion Functions (No Supabase client needed here) ---

/**
 * Converts an ImageGeneration database record into the standardized HistoryItem format.
 */
export function convertToImageHistoryItem(generation: ImageGeneration): HistoryItem {
   // console.log(`[convertToImageHistoryItem] Processing generation ID: ${generation.id}`);
   try {
      const imagesArray = Array.isArray(generation.generated_images) ? generation.generated_images : [];
      const validImagesArray = imagesArray.filter(img => img?.image_url);
      const historyItemOutput = validImagesArray.length > 0
        ? validImagesArray.map(img => validateAndFixImageUrl(img.image_url)).filter(url => url)
        : null;
      const finalOutput = (historyItemOutput && historyItemOutput.length > 0) ? historyItemOutput : null;

      return {
        id: generation.id, status: generation.status || "succeeded",
        input: {
            prompt: generation.prompt, negative_prompt: generation.negative_prompt || undefined,
            width: generation.width, height: generation.height, num_inference_steps: generation.steps,
            guidance_scale: generation.guidance_scale, num_images: validImagesArray.length,
            scheduler: generation.scheduler, seed: generation.seed || undefined, model: generation.model || "unknown",
        },
        output: finalOutput, created_at: generation.created_at, model: generation.model || "Unknown Image Model",
        type: 'image', error: generation.error || undefined,
      };
   } catch (error) {
      console.error("Error during convertToImageHistoryItem:", error, "Record:", generation);
      return {
        id: (generation as any)?.id || `error-img-${Date.now()}`, status: 'failed',
        input: { prompt: "Error: Conversion failed", width: 0, height: 0, num_inference_steps: 0, guidance_scale: 0, num_images: 0, scheduler: "", model: "unknown" },
        output: null, created_at: (generation as any)?.created_at || new Date().toISOString(),
        error: `Conversion failed: ${error instanceof Error ? error.message : String(error)}`, type: 'image',
      };
   }
}

/**
 * Converts a VideoGeneration database record into the standardized HistoryItem format.
 */
export function convertVideoToHistoryItem(generation: VideoGeneration): HistoryItem {
  try {
    const outputUrl = (generation.output_url && typeof generation.output_url === 'string' && generation.output_url.trim() !== '') ? generation.output_url : null;
    return {
      id: generation.replicate_id, status: generation.status || "processing",
      input: {
          prompt: generation.prompt, negative_prompt: generation.negative_prompt || undefined,
          width: generation.width, height: generation.height, num_inference_steps: 0, guidance_scale: 0,
          num_images: 1, scheduler: "", seed: generation.seed || undefined, model: generation.model_id || "unknown",
          num_frames: generation.num_frames || undefined, fps: generation.fps || undefined,
      },
      output: outputUrl ? [outputUrl] : null, created_at: generation.created_at,
      model: generation.model_id || "Unknown Video Model", type: 'video', error: generation.error || undefined,
    };
  } catch (error) {
    console.error("Error during convertVideoToHistoryItem:", error, "Record:", generation);
    return {
      id: (generation as any)?.replicate_id || `error-vid-${Date.now()}`, status: 'failed',
      input: { prompt: "Error: Conversion failed", width: 0, height: 0, num_inference_steps: 0, guidance_scale: 0, num_images: 0, scheduler: "", model: "unknown" },
      output: null, created_at: (generation as any)?.created_at || new Date().toISOString(),
      error: `Conversion failed: ${error instanceof Error ? error.message : String(error)}`, type: 'video',
    };
  }
}
