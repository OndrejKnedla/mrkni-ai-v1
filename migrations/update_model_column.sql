-- Update existing records in the image_generations table to populate the model column
-- This script will update records where model is NULL but the model ID is stored in the input parameters

-- First, create a temporary function to extract model names from model IDs
CREATE OR REPLACE FUNCTION get_model_name(model_id TEXT) RETURNS TEXT AS $$
BEGIN
    -- Extract the model name from the model ID (e.g., "stability-ai/stable-diffusion-3.5-large" -> "stable-diffusion-3.5-large")
    RETURN CASE
        WHEN model_id LIKE '%/%' THEN split_part(model_id, '/', 2)
        ELSE model_id
    END;
END;
$$ LANGUAGE plpgsql;

-- Update records where model is NULL but model ID is available in the input parameters
UPDATE public.image_generations
SET model = CASE
    -- Map model IDs to human-readable names
    WHEN model = 'stability-ai/stable-diffusion-3.5-large' THEN 'Stable Diffusion 3.5 Large'
    WHEN model = 'stability-ai/stable-diffusion-3.5-medium' THEN 'Stable Diffusion 3.5 Medium'
    WHEN model = 'stability-ai/stable-diffusion-3.5-small' THEN 'Stable Diffusion 3.5 Small'
    WHEN model = 'luma/photon' THEN 'Photon'
    WHEN model = 'luma/photon-flash' THEN 'Photon Flash'
    WHEN model = 'ideogram-ai/ideogram-v2' THEN 'Ideogram v2'
    WHEN model = 'ideogram-ai/ideogram-v2a' THEN 'Ideogram v2a'
    WHEN model = 'ideogram-ai/ideogram-v2-turbo' THEN 'Ideogram v2 Turbo'
    WHEN model = 'ideogram-ai/ideogram-v2a-turbo' THEN 'Ideogram v2a Turbo'
    WHEN model = 'google/imagen-3' THEN 'Imagen 3'
    WHEN model = 'google/imagen-3-fast' THEN 'Imagen 3 Fast'
    WHEN model = 'black-forest-labs/flux-pro' THEN 'Flux Pro'
    WHEN model = 'black-forest-labs/flux-dev' THEN 'Flux Dev'
    WHEN model = 'black-forest-labs/flux-schnell' THEN 'Flux Schnell'
    WHEN model = 'black-forest-labs/flux-1.1-pro' THEN 'Flux 1.1 Pro'
    WHEN model = 'black-forest-labs/flux-1.1-pro-ultra' THEN 'Flux 1.1 Pro Ultra'
    WHEN model = 'recraft/recraft-v3' THEN 'Recraft v3'
    WHEN model = 'recraft/recraft-v3-svg' THEN 'Recraft v3 SVG'
    WHEN model = 'minimax/image-01' THEN 'MiniMax Image-01'
    ELSE model -- Keep the original value if no mapping exists
END
WHERE model IS NOT NULL;

-- Drop the temporary function
DROP FUNCTION IF EXISTS get_model_name(TEXT);
