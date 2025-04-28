import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.");
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

    const results: Record<string, any> = {};

    // Check image_generations table
    try {
      const { data: imageGenerationsData, error: imageGenerationsError } = await supabaseServiceClient
        .from('image_generations')
        .select('count(*)')
        .limit(1);

      results.image_generations = {
        exists: !imageGenerationsError,
        error: imageGenerationsError ? imageGenerationsError.message : null
      };
    } catch (error: any) {
      results.image_generations = {
        exists: false,
        error: error.message
      };
    }

    // Check generated_images table
    try {
      const { data: generatedImagesData, error: generatedImagesError } = await supabaseServiceClient
        .from('generated_images')
        .select('count(*)')
        .limit(1);

      results.generated_images = {
        exists: !generatedImagesError,
        error: generatedImagesError ? generatedImagesError.message : null
      };
    } catch (error: any) {
      results.generated_images = {
        exists: false,
        error: error.message
      };
    }

    // Check credits table
    try {
      const { data: creditsData, error: creditsError } = await supabaseServiceClient
        .from('credits')
        .select('count(*)')
        .limit(1);

      results.credits = {
        exists: !creditsError,
        error: creditsError ? creditsError.message : null
      };
    } catch (error: any) {
      results.credits = {
        exists: false,
        error: error.message
      };
    }

    // Check subscriptions table
    try {
      const { data: subscriptionsData, error: subscriptionsError } = await supabaseServiceClient
        .from('subscriptions')
        .select('count(*)')
        .limit(1);

      results.subscriptions = {
        exists: !subscriptionsError,
        error: subscriptionsError ? subscriptionsError.message : null
      };
    } catch (error: any) {
      results.subscriptions = {
        exists: false,
        error: error.message
      };
    }

    // Check storage bucket
    try {
      const { data: buckets, error: bucketsError } = await supabaseServiceClient.storage.listBuckets();
      
      if (bucketsError) {
        results.storage_bucket = {
          exists: false,
          error: bucketsError.message
        };
      } else {
        const generatedImagesBucket = buckets.find((bucket: any) => bucket.name === 'generated-images');
        results.storage_bucket = {
          exists: !!generatedImagesBucket,
          error: null
        };
      }
    } catch (error: any) {
      results.storage_bucket = {
        exists: false,
        error: error.message
      };
    }

    // Check decrement_image_credit function
    try {
      const { data: functionData, error: functionError } = await supabaseServiceClient.rpc(
        'decrement_image_credit',
        { p_user_id: '00000000-0000-0000-0000-000000000000' } // Dummy UUID
      );

      results.decrement_image_credit = {
        exists: !functionError || functionError.code !== '42883', // 42883 is "function does not exist"
        error: functionError ? functionError.message : null
      };
    } catch (error: any) {
      results.decrement_image_credit = {
        exists: false,
        error: error.message
      };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error checking tables:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
