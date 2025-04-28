# Video Generation Guide

This guide explains how to use the video generation feature in the application.

## Overview

The video generation feature allows you to create videos using AI models in two ways:
1. **Text-to-Video**: Generate videos from text descriptions
2. **Image-to-Video**: Animate still images with motion

## Supported Models

### Text-to-Video Models
- **AnimateDiff**: High-quality artistic animations from text prompts
- **Hotshot-XL**: Fast text-to-GIF model for quick animations

### Image-to-Video Models
- **I2VGen-XL**: Specialized model for animating still images with natural motion

## How to Use

1. Navigate to the Video page
2. Select the generation mode (Text-to-Video or Image-to-Video)
3. Choose a model from the dropdown
4. Enter your prompt or upload an image
5. Adjust settings if needed
6. Click "Generate Video"

## Tips for Best Results

### Text-to-Video
- Be specific and descriptive in your prompts
- Include details about motion, lighting, and style
- Use negative prompts to avoid unwanted elements

### Image-to-Video
- Use clear, high-quality images
- Images with simple backgrounds work best
- For best results, use images with a single subject

## Troubleshooting

If you encounter issues with video generation:

1. **Model Not Available**: The application will automatically switch to a working model
2. **Generation Fails**: Try a different model or simplify your prompt
3. **Poor Quality**: Adjust settings like guidance scale or number of steps

## Technical Details

### API Endpoint

The video generation API is available at `/api/generate-video` and accepts the following parameters:

```json
{
  "modelId": "model-id",
  "version": "model-version",
  "prompt": "Your prompt here",
  "negative_prompt": "Elements to avoid",
  "image": "base64-encoded-image", // For image-to-video
  "width": 512,
  "height": 512,
  "num_frames": 16,
  "fps": 8,
  "seed": 12345,
  "guidance_scale": 7.5,
  "num_inference_steps": 25
}
```

### Model-Specific Parameters

#### AnimateDiff
- `model_name`: Model variant to use (default: "toonyou_beta3")
- `motion_module`: Motion module to use (default: "mm_sd_v15_v2")

#### Hotshot-XL
- Supports standard parameters

#### I2VGen-XL
- Requires an image
- Optional prompt to guide the animation

## Credits

The video generation feature uses models from:
- Lucataco (AnimateDiff, Hotshot-XL)
- Ali-ViLab (I2VGen-XL)

All models are hosted on Replicate.com and subject to their terms of service.
