"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Info, Lightbulb, Sparkles } from "lucide-react"

export default function UsageGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">MrkniAI Usage Guide</h1>
        <p className="text-white/70 mt-2 max-w-2xl mx-auto">
          A comprehensive guide to using all features of the MrkniAI platform
        </p>
      </div>

      <Tabs defaultValue="images" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-4 bg-white/20 backdrop-blur-sm">
          <TabsTrigger
            value="images"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
          >
            Image Generation
          </TabsTrigger>
          <TabsTrigger
            value="video"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
          >
            Video Generation
          </TabsTrigger>
          <TabsTrigger
            value="prompt"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
          >
            Prompt Assistant
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white"
          >
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Image Generation Guide</CardTitle>
              <CardDescription className="text-white/70">
                Learn how to create stunning AI-generated images
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white/90 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Step 1: Choose Your AI Model
                </h3>
                <p>
                  Different AI models have different strengths and capabilities. Select the model that best fits your
                  needs:
                </p>
                <ul className="list-disc pl-8 space-y-1">
                  <li>
                    <strong>Stable Diffusion 3.5 Large</strong> - Excellent for high-resolution, detailed images with
                    fine details (Premium)
                  </li>
                  <li>
                    <strong>Flux Pro</strong> - Great for photorealistic images with excellent prompt adherence (Basic)
                  </li>
                  <li>
                    <strong>Flux Dev</strong> - Fast generation for iterative development (Free)
                  </li>
                </ul>
                <div className="bg-black/20 p-4 rounded-md mt-2 flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    Your subscription tier determines which models you can access. Upgrade your subscription to unlock
                    more powerful models.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Step 2: Craft Your Prompt
                </h3>
                <p>
                  The prompt is the most important part of generating an image. Be specific and detailed about what you
                  want to see.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-black/20 p-3 rounded-md">
                    <p className="font-medium text-red-300">Basic prompt:</p>
                    <p className="italic">"A cat"</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-md">
                    <p className="font-medium text-green-300">Detailed prompt:</p>
                    <p className="italic">
                      "A fluffy orange tabby cat sitting on a windowsill, looking out at a rainy day, soft afternoon
                      light, cozy atmosphere, detailed fur, photorealistic style"
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="font-medium">Key elements to include in your prompt:</p>
                  <ul className="list-disc pl-8 space-y-1 mt-1">
                    <li>Subject description (what/who is in the image)</li>
                    <li>Setting or environment</li>
                    <li>Lighting conditions</li>
                    <li>Mood or atmosphere</li>
                    <li>Art style (photorealistic, painting, anime, etc.)</li>
                    <li>Camera perspective (close-up, wide angle, etc.)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Step 3: Use Negative Prompts
                </h3>
                <p>
                  Negative prompts tell the AI what you don't want to see in the image. This is useful for avoiding
                  common issues.
                </p>
                <div className="bg-black/20 p-3 rounded-md mt-2">
                  <p className="font-medium">Example negative prompt:</p>
                  <p className="italic">
                    "deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly
                    drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blurry, watermark,
                    text, low quality"
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Step 4: Configure Advanced Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div>
                    <p className="font-medium mb-1">Dimensions:</p>
                    <ul className="list-disc pl-8 space-y-1">
                      <li>
                        <strong>512x512</strong> - Faster generation, good for testing
                      </li>
                      <li>
                        <strong>768x768</strong> - Balanced quality and speed
                      </li>
                      <li>
                        <strong>1024x1024</strong> - Higher quality, slower generation
                      </li>
                      <li>
                        <strong>1536x1536</strong> - Highest quality (Premium models only)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Other parameters:</p>
                    <ul className="list-disc pl-8 space-y-1">
                      <li>
                        <strong>Inference Steps</strong> - Higher values (30-50) produce more detailed images but take
                        longer
                      </li>
                      <li>
                        <strong>Guidance Scale</strong> - Higher values (7-15) make the AI follow your prompt more
                        closely
                      </li>
                      <li>
                        <strong>Scheduler</strong> - Different schedulers produce different styles of images
                      </li>
                      <li>
                        <strong>Seed</strong> - Use the same seed to create variations of the same image
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Step 5: Generate and Iterate
                </h3>
                <p>
                  Click "Generate Images" and wait for the AI to create your image. If you're not satisfied with the
                  results, try:
                </p>
                <ul className="list-disc pl-8 space-y-1 mt-1">
                  <li>Adjusting your prompt to be more specific</li>
                  <li>Changing the model or parameters</li>
                  <li>Using the same seed but tweaking other settings</li>
                  <li>Adding more details to your negative prompt</li>
                </ul>
              </div>

              <div className="p-4 border border-primary/30 bg-primary/10 rounded-md">
                <div className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                  <p>
                    <span className="font-medium">Pro tip:</span> Use the Prompt Assistant to help you craft better
                    prompts. It will guide you through the process of creating a detailed prompt by asking you specific
                    questions about what you want to see in your image.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Video Generation Guide</CardTitle>
              <CardDescription className="text-white/70">
                Learn how to create AI-generated videos from text prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white/90 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Understanding Video Generation
                </h3>
                <p>
                  AI video generation creates short video clips based on your text description. Unlike image generation,
                  video generation requires more computational resources and credits.
                </p>
                <div className="bg-black/20 p-4 rounded-md mt-2 flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    Video generation is available to Basic and Premium subscribers only. Basic subscribers get 5 video
                    credits per month, while Premium subscribers get 20 video credits per month.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Creating Effective Video Prompts
                </h3>
                <p>
                  Video prompts should describe both the visual elements and the motion or action you want to see. Be
                  specific about:
                </p>
                <ul className="list-disc pl-8 space-y-1 mt-1">
                  <li>The main subject and its appearance</li>
                  <li>The environment or setting</li>
                  <li>The action or movement you want to see</li>
                  <li>The camera movement (if any)</li>
                  <li>The overall style and mood</li>
                </ul>
                <div className="bg-black/20 p-3 rounded-md mt-2">
                  <p className="font-medium">Example video prompt:</p>
                  <p className="italic">
                    "A red fox running through a snowy forest, camera following alongside, soft snowflakes falling,
                    cinematic lighting, 4K quality, smooth motion"
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Video Generation Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div>
                    <p className="font-medium mb-1">Key parameters:</p>
                    <ul className="list-disc pl-8 space-y-1">
                      <li>
                        <strong>Dimensions</strong> - The size of the video (512x512, 768x768, etc.)
                      </li>
                      <li>
                        <strong>Number of Frames</strong> - More frames create longer videos but take more time to
                        generate
                      </li>
                      <li>
                        <strong>Frames Per Second (FPS)</strong> - Higher FPS creates smoother motion
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Tips for better results:</p>
                    <ul className="list-disc pl-8 space-y-1">
                      <li>Start with shorter videos (16-24 frames) to test your prompt</li>
                      <li>Use 8 FPS for most videos (higher isn't always better)</li>
                      <li>Keep the motion simple - complex actions may not render well in short clips</li>
                      <li>Use negative prompts to avoid visual artifacts</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Working with Generated Videos
                </h3>
                <p>
                  After generating a video, you can download it or share it directly. Videos are saved in MP4 format and
                  can be used in your projects or shared on social media.
                </p>
                <div className="p-4 border border-primary/30 bg-primary/10 rounded-md mt-2">
                  <div className="flex items-start">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <p>
                      <span className="font-medium">Pro tip:</span> For longer or more complex videos, consider
                      generating multiple short clips and combining them in video editing software.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Prompt Assistant Guide</CardTitle>
              <CardDescription className="text-white/70">
                Learn how to use the Prompt Assistant to create better prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white/90 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  What is the Prompt Assistant?
                </h3>
                <p>
                  The Prompt Assistant is an interactive tool that helps you create detailed and effective prompts for
                  image generation. It asks you a series of questions about what you want to see in your image and then
                  constructs a comprehensive prompt based on your answers.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Using the Prompt Assistant
                </h3>
                <p>The Prompt Assistant will guide you through these key aspects of your image:</p>
                <ol className="list-decimal pl-8 space-y-2 mt-2">
                  <li>
                    <strong>Main Subject</strong> - What is the primary focus of your image? (e.g., "a majestic eagle",
                    "a futuristic city", "a portrait of a young woman")
                  </li>
                  <li>
                    <strong>Environment</strong> - Where is the subject located? (e.g., "on a mountain peak", "in a
                    cyberpunk metropolis", "in a studio with soft lighting")
                  </li>
                  <li>
                    <strong>Style</strong> - What artistic style do you want? (e.g., "photorealistic", "oil painting",
                    "anime", "digital art")
                  </li>
                  <li>
                    <strong>Atmosphere</strong> - What mood or feeling should the image convey? (e.g., "peaceful",
                    "dramatic", "mysterious", "joyful")
                  </li>
                  <li>
                    <strong>Colors</strong> - Any specific color palette or lighting? (e.g., "warm sunset colors", "cool
                    blue tones", "high contrast", "golden hour lighting")
                  </li>
                  <li>
                    <strong>Details</strong> - Any specific technical details or additional elements? (e.g., "shallow
                    depth of field", "detailed textures", "4K quality", "cinematic composition")
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Language Support
                </h3>
                <p>
                  The Prompt Assistant supports multiple languages, allowing you to interact in your preferred language.
                  Simply select your language from the dropdown menu at the top of the Prompt Assistant panel.
                </p>
                <div className="bg-black/20 p-4 rounded-md mt-2 flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    While you can interact with the Prompt Assistant in your language, the final prompt will be
                    constructed in English for optimal results with the AI models.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Tips for Using the Prompt Assistant
                </h3>
                <ul className="list-disc pl-8 space-y-1 mt-1">
                  <li>Be as specific as possible in your answers</li>
                  <li>Don't worry about formatting or syntax - the Assistant will structure everything correctly</li>
                  <li>
                    You can always edit the final prompt before generating if you want to make additional adjustments
                  </li>
                  <li>The Assistant also provides a default negative prompt that helps avoid common issues</li>
                </ul>
              </div>

              <div className="p-4 border border-primary/30 bg-primary/10 rounded-md">
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                  <p>
                    <span className="font-medium">Pro tip:</span> Even experienced users can benefit from the Prompt
                    Assistant. It ensures you don't forget important aspects of your prompt and helps structure your
                    ideas in a way that works well with AI image generation models.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Subscription Guide</CardTitle>
              <CardDescription className="text-white/70">
                Understanding subscription tiers, credits, and features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white/90 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Subscription Tiers Overview
                </h3>
                <p>
                  MrkniAI offers three subscription tiers to meet different needs and budgets. Each tier provides access
                  to different AI models and a specific number of generation credits.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-black/20 p-4 rounded-md">
                    <h4 className="font-medium text-center mb-2">Free</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>5 image credits per month</li>
                      <li>Access to basic models</li>
                      <li>Max resolution: 768x768</li>
                      <li>Community support</li>
                      <li>No video generation</li>
                    </ul>
                  </div>
                  <div className="bg-amber-900/30 border border-amber-500/30 p-4 rounded-md">
                    <h4 className="font-medium text-center mb-2">Basic ($9.99/month)</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>50 image credits per month</li>
                      <li>5 video credits per month</li>
                      <li>Access to intermediate models</li>
                      <li>Max resolution: 1024x1024</li>
                      <li>Priority support</li>
                    </ul>
                  </div>
                  <div className="bg-primary/20 border border-primary/30 p-4 rounded-md">
                    <h4 className="font-medium text-center mb-2">Premium ($29.99/month)</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Unlimited image generations</li>
                      <li>20 video credits per month</li>
                      <li>Access to all models</li>
                      <li>Max resolution: 1536x1536</li>
                      <li>Priority support</li>
                      <li>Early access to new features</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Understanding Credits
                </h3>
                <p>
                  Credits are used to generate images and videos. Each generation consumes one credit, regardless of the
                  model or settings used.
                </p>
                <ul className="list-disc pl-8 space-y-1 mt-1">
                  <li>
                    <strong>Image Credits</strong> - Each image generation uses 1 credit, even when generating multiple
                    images at once
                  </li>
                  <li>
                    <strong>Video Credits</strong> - Each video generation uses 1 credit, regardless of length or
                    resolution
                  </li>
                  <li>Credits reset at the beginning of each billing cycle</li>
                  <li>Unused credits do not roll over to the next month</li>
                </ul>
                <div className="bg-black/20 p-4 rounded-md mt-2 flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    Premium subscribers have unlimited image generations, but video generations are still limited to 20
                    per month.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Available Models by Tier
                </h3>
                <p>Each subscription tier gives you access to different AI models:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="font-medium mb-1">Free Tier Models:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Flux Dev</li>
                      <li>Flux Schnell</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Basic Tier Models:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>All Free tier models</li>
                      <li>Flux Pro</li>
                      <li>Flux 1.1 Pro</li>
                      <li>Stable Diffusion 3.5 Medium</li>
                      <li>Stable Diffusion 3.5 Large Turbo</li>
                      <li>Ideogram v2 Turbo</li>
                      <li>Recraft v3</li>
                      <li>Recraft v3 SVG</li>
                      <li>MiniMax Image-01</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Premium Tier Models:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>All Basic tier models</li>
                      <li>Stable Diffusion 3.5 Large</li>
                      <li>Flux 1.1 Pro Ultra</li>
                      <li>Imagen 3</li>
                      <li>Imagen 3 Fast</li>
                      <li>Photon</li>
                      <li>Photon Flash</li>
                      <li>Ideogram v2</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/20 p-1 rounded-full mr-2 inline-flex">
                    <Check className="h-5 w-5 text-primary" />
                  </span>
                  Managing Your Subscription
                </h3>
                <p>You can manage your subscription from the Subscription page. From there, you can:</p>
                <ul className="list-disc pl-8 space-y-1 mt-1">
                  <li>View your current subscription tier</li>
                  <li>See how many credits you have remaining</li>
                  <li>Upgrade to a higher tier</li>
                  <li>Cancel your subscription</li>
                </ul>
                <div className="p-4 border border-primary/30 bg-primary/10 rounded-md mt-2">
                  <div className="flex items-start">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <p>
                      <span className="font-medium">Pro tip:</span> If you're not sure which tier is right for you,
                      start with the Free tier to test the platform, then upgrade to Basic or Premium as needed. You can
                      change your subscription at any time, and the new tier will take effect immediately.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
