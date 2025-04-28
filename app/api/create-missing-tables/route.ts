import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key environment variables.");
}

export async function POST(request: Request) {
  try {
    // Create Supabase client with service role key
    const supabaseServiceClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: Record<string, any> = {};

    // Check and create image_generations table
    try {
      const { data: imageGenerationsData, error: imageGenerationsError } = await supabaseServiceClient
        .from('image_generations')
        .select('count(*)')
        .limit(1);

      if (imageGenerationsError && imageGenerationsError.code === '42P01') { // Table doesn't exist
        // Create image_generations table
        const createTableResult = await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.image_generations (
              id UUID PRIMARY KEY,
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
            
            CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON public.image_generations(user_id);
            
            ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Users can view their own image generations" 
              ON public.image_generations FOR SELECT 
              USING (auth.uid() = user_id);
            
            CREATE POLICY "Service role can manage all image generations" 
              ON public.image_generations FOR ALL 
              USING (true);
          `
        });
        
        results.image_generations = {
          created: true,
          error: createTableResult.error ? createTableResult.error.message : null
        };
      } else {
        results.image_generations = {
          created: false,
          exists: true,
          error: null
        };
      }
    } catch (error: any) {
      results.image_generations = {
        created: false,
        error: error.message
      };
    }

    // Check and create generated_images table
    try {
      const { data: generatedImagesData, error: generatedImagesError } = await supabaseServiceClient
        .from('generated_images')
        .select('count(*)')
        .limit(1);

      if (generatedImagesError && generatedImagesError.code === '42P01') { // Table doesn't exist
        // Create generated_images table
        const createTableResult = await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.generated_images (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              generation_id UUID NOT NULL REFERENCES public.image_generations(id) ON DELETE CASCADE,
              image_url TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_generated_images_generation_id ON public.generated_images(generation_id);
            
            ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
            
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
        
        results.generated_images = {
          created: true,
          error: createTableResult.error ? createTableResult.error.message : null
        };
      } else {
        results.generated_images = {
          created: false,
          exists: true,
          error: null
        };
      }
    } catch (error: any) {
      results.generated_images = {
        created: false,
        error: error.message
      };
    }

    // Check and create credits table
    try {
      const { data: creditsData, error: creditsError } = await supabaseServiceClient
        .from('credits')
        .select('count(*)')
        .limit(1);

      if (creditsError && creditsError.code === '42P01') { // Table doesn't exist
        // Create credits table
        const createTableResult = await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.credits (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL,
              image_credits INTEGER NOT NULL DEFAULT 5,
              video_credits INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
              CONSTRAINT unique_user_credits UNIQUE (user_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
            
            ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Users can view their own credits" 
              ON public.credits FOR SELECT 
              USING (auth.uid() = user_id);
            
            CREATE POLICY "Service role can manage all credits" 
              ON public.credits FOR ALL 
              USING (true);
          `
        });
        
        results.credits = {
          created: true,
          error: createTableResult.error ? createTableResult.error.message : null
        };
      } else {
        results.credits = {
          created: false,
          exists: true,
          error: null
        };
      }
    } catch (error: any) {
      results.credits = {
        created: false,
        error: error.message
      };
    }

    // Check and create subscriptions table
    try {
      const { data: subscriptionsData, error: subscriptionsError } = await supabaseServiceClient
        .from('subscriptions')
        .select('count(*)')
        .limit(1);

      if (subscriptionsError && subscriptionsError.code === '42P01') { // Table doesn't exist
        // Create subscriptions table
        const createTableResult = await supabaseServiceClient.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.subscriptions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL,
              tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
              status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
              current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
              current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
            
            ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Users can view their own subscriptions" 
              ON public.subscriptions FOR SELECT 
              USING (auth.uid() = user_id);
            
            CREATE POLICY "Service role can manage all subscriptions" 
              ON public.subscriptions FOR ALL 
              USING (true);
          `
        });
        
        results.subscriptions = {
          created: true,
          error: createTableResult.error ? createTableResult.error.message : null
        };
      } else {
        results.subscriptions = {
          created: false,
          exists: true,
          error: null
        };
      }
    } catch (error: any) {
      results.subscriptions = {
        created: false,
        error: error.message
      };
    }

    // Check and create storage bucket
    try {
      const { data: buckets, error: bucketsError } = await supabaseServiceClient.storage.listBuckets();
      
      if (!bucketsError) {
        const generatedImagesBucket = buckets.find((bucket: any) => bucket.name === 'generated-images');
        
        if (!generatedImagesBucket) {
          // Create storage bucket
          const { data: newBucket, error: createBucketError } = await supabaseServiceClient.storage.createBucket('generated-images', {
            public: true
          });
          
          results.storage_bucket = {
            created: !createBucketError,
            error: createBucketError ? createBucketError.message : null
          };
        } else {
          results.storage_bucket = {
            created: false,
            exists: true,
            error: null
          };
        }
      } else {
        results.storage_bucket = {
          created: false,
          error: bucketsError.message
        };
      }
    } catch (error: any) {
      results.storage_bucket = {
        created: false,
        error: error.message
      };
    }

    // Create decrement_image_credit function
    try {
      const createFunctionResult = await supabaseServiceClient.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.decrement_image_credit(p_user_id UUID)
          RETURNS BOOLEAN AS $$
          DECLARE
              v_credits INTEGER;
          BEGIN
              -- Get current credits
              SELECT image_credits INTO v_credits
              FROM public.credits
              WHERE user_id = p_user_id;
              
              -- Check if user has enough credits
              IF v_credits IS NULL OR v_credits <= 0 THEN
                  RETURN FALSE;
              END IF;
              
              -- Decrement credits
              UPDATE public.credits
              SET 
                  image_credits = image_credits - 1,
                  updated_at = now()
              WHERE user_id = p_user_id;
              
              RETURN TRUE;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      results.decrement_image_credit = {
        created: !createFunctionResult.error,
        error: createFunctionResult.error ? createFunctionResult.error.message : null
      };
    } catch (error: any) {
      results.decrement_image_credit = {
        created: false,
        error: error.message
      };
    }

    // Create decrement_video_credit function
    try {
      const createFunctionResult = await supabaseServiceClient.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.decrement_video_credit(p_user_id UUID)
          RETURNS BOOLEAN AS $$
          DECLARE
              v_credits INTEGER;
          BEGIN
              -- Get current credits
              SELECT video_credits INTO v_credits
              FROM public.credits
              WHERE user_id = p_user_id;
              
              -- Check if user has enough credits
              IF v_credits IS NULL OR v_credits <= 0 THEN
                  RETURN FALSE;
              END IF;
              
              -- Decrement credits
              UPDATE public.credits
              SET 
                  video_credits = video_credits - 1,
                  updated_at = now()
              WHERE user_id = p_user_id;
              
              RETURN TRUE;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      results.decrement_video_credit = {
        created: !createFunctionResult.error,
        error: createFunctionResult.error ? createFunctionResult.error.message : null
      };
    } catch (error: any) {
      results.decrement_video_credit = {
        created: false,
        error: error.message
      };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error creating tables:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
