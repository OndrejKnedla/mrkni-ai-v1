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

    console.log("Fixing image_generations table to accept string IDs...");

    // First, check if we need to drop the foreign key constraint in generated_images
    try {
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
      console.log("Dropped foreign key constraint if it existed");
    } catch (error: any) {
      console.error("Error dropping foreign key constraint:", error.message);
      // Continue anyway, as the constraint might not exist
    }

    // Now create a new temporary table with the correct structure
    try {
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
        `
      });
      console.log("Created new table with text ID");
    } catch (error: any) {
      console.error("Error creating new table:", error.message);
      return NextResponse.json({ error: "Failed to create new table", details: error.message }, { status: 500 });
    }

    // Copy data from old table to new table if the old table exists
    try {
      await supabaseServiceClient.rpc('exec_sql', {
        sql: `
          -- Copy data from old table to new table if it exists
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'image_generations' 
              AND table_schema = 'public'
            ) THEN
              -- Try to copy data, but it might fail if the old table has UUID ids that can't be cast to text
              BEGIN
                INSERT INTO public.image_generations_new
                SELECT * FROM public.image_generations
                ON CONFLICT (id) DO NOTHING;
              EXCEPTION WHEN OTHERS THEN
                -- Just log the error and continue
                RAISE NOTICE 'Error copying data: %', SQLERRM;
              END;
            END IF;
          END
          $$;
        `
      });
      console.log("Attempted to copy data from old table");
    } catch (error: any) {
      console.error("Error copying data:", error.message);
      // Continue anyway, as we might not need the old data
    }

    // Rename tables
    try {
      await supabaseServiceClient.rpc('exec_sql', {
        sql: `
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
        `
      });
      console.log("Renamed tables");
    } catch (error: any) {
      console.error("Error renaming tables:", error.message);
      return NextResponse.json({ error: "Failed to rename tables", details: error.message }, { status: 500 });
    }

    // Create indexes and RLS policies
    try {
      await supabaseServiceClient.rpc('exec_sql', {
        sql: `
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
      console.log("Created indexes and RLS policies");
    } catch (error: any) {
      console.error("Error creating indexes and RLS policies:", error.message);
      // Continue anyway, as the policies might already exist
    }

    // Now fix the generated_images table to use TEXT for generation_id
    try {
      await supabaseServiceClient.rpc('exec_sql', {
        sql: `
          -- Create a new temporary table with text generation_id
          CREATE TABLE IF NOT EXISTS public.generated_images_new (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            generation_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
          );
          
          -- Copy data from old table to new table if it exists
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'generated_images' 
              AND table_schema = 'public'
            ) THEN
              -- Try to copy data, but it might fail if the old table has UUID generation_ids that can't be cast to text
              BEGIN
                INSERT INTO public.generated_images_new
                SELECT id, generation_id::text, image_url, created_at FROM public.generated_images
                ON CONFLICT (id) DO NOTHING;
              EXCEPTION WHEN OTHERS THEN
                -- Just log the error and continue
                RAISE NOTICE 'Error copying data: %', SQLERRM;
              END;
            END IF;
          END
          $$;
          
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
      console.log("Fixed generated_images table");
    } catch (error: any) {
      console.error("Error fixing generated_images table:", error.message);
      return NextResponse.json({ error: "Failed to fix generated_images table", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tables fixed successfully" });
  } catch (error: any) {
    console.error("Error fixing tables:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
