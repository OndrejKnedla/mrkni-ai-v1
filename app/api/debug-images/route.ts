import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"
import { createClient } from '@supabase/supabase-js'

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.")
}

export async function GET(request: Request) {
  try {
    // Create Supabase client with service role key
    const supabaseServiceClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the current user
    const supabaseUserClient = createServerActionClient()
    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all image generations for the user
    const { data: generations, error: genError } = await supabaseServiceClient
      .from("image_generations")
      .select("id, model, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (genError) {
      console.error("Error fetching generations:", genError);
      return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 });
    }

    // Fetch all generated images
    const { data: images, error: imgError } = await supabaseServiceClient
      .from("generated_images")
      .select("id, generation_id, image_url")
      .in("generation_id", generations.map(g => g.id));

    if (imgError) {
      console.error("Error fetching images:", imgError);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    // Group images by generation
    const generationsWithImages = generations.map(gen => {
      const genImages = images.filter(img => img.generation_id === gen.id);
      return {
        ...gen,
        images: genImages,
        imageCount: genImages.length
      };
    });

    // Fix any image URLs that don't have https:// prefix
    let fixedCount = 0;
    for (const image of images) {
      if (image.image_url && image.image_url.includes('supabase.co/storage/v1/object/public') && !image.image_url.startsWith('http')) {
        // Fix the URL
        const fixedUrl = 'https://' + image.image_url;
        console.log(`Fixing URL: ${image.image_url} -> ${fixedUrl}`);
        
        // Update the URL in the database
        const { error: updateError } = await supabaseServiceClient
          .from("generated_images")
          .update({ image_url: fixedUrl })
          .eq("id", image.id);
        
        if (updateError) {
          console.error(`Error updating image ${image.id}:`, updateError);
        } else {
          fixedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      generations: generationsWithImages.length,
      images: images.length,
      fixedUrls: fixedCount,
      data: generationsWithImages
    });
  } catch (error: any) {
    console.error("Error in debug-images API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
