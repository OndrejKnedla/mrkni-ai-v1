'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function RunSqlPage() {
  const [sql, setSql] = useState<string>(`-- Drop the foreign key constraint if it exists
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

-- Now fix the generated_images table to use TEXT for generation_id
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
  USING (true);`);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSql = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/admin/run-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error running SQL:', error);
      setResult({ error: 'Failed to run SQL' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Run SQL</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run SQL</CardTitle>
          <CardDescription>
            Run SQL commands on the Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="h-96"
            />
          </div>
          <Button onClick={runSql} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run SQL'}
          </Button>
        </CardContent>
        {result && (
          <CardFooter>
            <pre className="bg-gray-100 p-4 rounded overflow-auto w-full">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
