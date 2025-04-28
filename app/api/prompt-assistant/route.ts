import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'

// Ensure the API key is available
const groqApiKey = process.env.GROQ_API_KEY
if (!groqApiKey) {
  console.error('GROQ_API_KEY is not set in environment variables.')
  // Optionally throw an error during build/startup if preferred
}

const groq = new Groq({ apiKey: groqApiKey })

export async function POST(request: Request) {
  if (!groqApiKey) {
    return NextResponse.json({ error: 'API key not configured correctly.' }, { status: 500 })
  }

  try {
    // Extract messages and the new hasImage flag
    const { messages, hasImage } = (await request.json()) as {
      messages: ChatCompletionMessageParam[];
      hasImage?: boolean; // Optional flag
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 })
    }

    // Base system prompt
    let systemPrompt = `You are an expert AI assistant specializing in crafting highly detailed and effective prompts for advanced image generation models (like Stable Diffusion, Flux, Midjourney). Your primary goal is to guide the user through a collaborative conversation to create the best possible prompt for their desired image.`;

    // Add specific instructions based on whether an image was uploaded
    if (hasImage) {
      systemPrompt += `

**IMPORTANT CONTEXT: The user has uploaded an image.** Your goal is now to help them create a prompt to *transform* this existing image based on their text descriptions. Acknowledge that you see they've uploaded an image (though you cannot *actually* see it). Focus your questions on how they want to change or modify the uploaded image (e.g., "What style should I transform the image into?", "What elements should be added or changed?", "Describe the desired mood for the transformed image."). Do NOT ask for descriptions of a new scene from scratch.`;
    } else {
      systemPrompt += `

Key Objectives (Generating from Text):
1.  **Understand the Core Idea:** Start by asking what the user wants to generate (the main subject).
2.  **Elicit Details:** Proactively ask clarifying questions to gather details about:
    *   **Subject Details:** Appearance, clothing, expression, specific features.
    *   **Setting/Environment:** Location, background details, time of day.
    *   **Action/Pose:** What is the subject doing?
    *   **Art Style:** Photorealistic, oil painting, watercolor, anime, cartoon, 3D render, pixel art, abstract, etc. Offer examples if needed.
    *   **Composition:** Close-up, medium shot, wide shot, specific camera angle (low angle, high angle), rule of thirds, etc.
    *   **Lighting:** Soft light, dramatic lighting, neon glow, golden hour, studio lighting, volumetric lighting, etc.
    *   **Mood/Atmosphere:** Cinematic, mysterious, cheerful, calm, epic, romantic, eerie, etc.
    *   **Colors:** Specific color palettes or dominant colors.
    *   **Quality Descriptors:** Add terms like "highly detailed", "masterpiece", "4k", "sharp focus", "intricate details" where appropriate.
    *   **Negative Prompts:** Ask the user what they *don't* want to see (e.g., "ugly", "deformed", "text", "watermark", "low quality", "blurry"). Incorporate these into a negative prompt suggestion if the user provides input, otherwise use a sensible default.`;
    }

    // Common instructions for both scenarios
    systemPrompt += `

Common Instructions:
*   **Language Handling:** Strictly respond in the **same language** as the user's **last message** for all conversational turns (e.g., if the user writes in Czech, respond in Czech; if they switch to German, respond in German).
*   **Final Output:** Once you have gathered sufficient details and confirmed with the user, provide the final **English** prompt, enclosed ONLY within <prompt_en> tags. Example: <prompt_en>cinematic wide shot of a majestic red dragon flying over a medieval castle during a stormy night, dramatic lightning illuminating the scene, photorealistic style, highly detailed, 4k</prompt_en>. Do NOT include the negative prompt within these tags. Provide the negative prompt separately in the conversational text if discussed. For all conversational messages before the final prompt, respond naturally in the language matching the user's last input, without using the tags.`

    // Prepend the system prompt to the message history if it's not already there
    // or if it's the start of a new conversation.
    const conversationHistory: ChatCompletionMessageParam[] =
      messages[0]?.role === 'system'
        ? messages // Assume system prompt is already included if first message is system
        : [{ role: 'system', content: systemPrompt }, ...messages]

    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory,
      model: 'llama3-70b-8192', // Or another suitable Groq model like 'mixtral-8x7b-32768'
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false, // Keep stream false for simple request/response
      // stop: null, // Not needed for non-streaming
    })

    const aiMessage = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ response: aiMessage })
  } catch (error: any) {
    console.error('Error calling Groq API:', error)
    return NextResponse.json({ error: error.message || 'Failed to get response from AI assistant.' }, { status: 500 })
  }
}
