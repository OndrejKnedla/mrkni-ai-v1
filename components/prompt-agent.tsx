"use client"

import { useState, useEffect, useRef, ChangeEvent } from "react"
import Image from "next/image" // Import Image component
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Import Input for file upload
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/lib/types"
import { Bot, Send, User, Loader2, Upload, X } from "lucide-react" // Add Upload and X icons
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "./ui-overrides"

interface PromptAgentProps {
  // Update the callback to include optional image data (as base64 string)
  onPromptGenerated: (prompt: string, negativePrompt: string, image?: string) => void
}

// Default negative prompt
const DEFAULT_NEGATIVE_PROMPT = "deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blurry, ((((mutated hands and fingers)))), watermark, watermarked, oversaturated, censored, distorted hands, amputation, missing hands, obese, doubled face, double hands"

export function PromptAgent({ onPromptGenerated }: PromptAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null) // State for base64 image data URL
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for file input
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Simplified initial greeting (always English, Groq will adapt)
  const initialGreeting: ChatMessage = { role: 'assistant', content: "Hi! I'll help you create a great prompt for image generation. What would you like to see in your image?" }

  // Set initial message on mount
  useEffect(() => {
    setMessages([initialGreeting])
  }, []) // Run only once

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const newUserMessage: ChatMessage = { role: "user", content: input }
    const currentMessages = [...messages, newUserMessage]
    setMessages(currentMessages)
    setInput("")
    setIsLoading(true)

    // Include image information in the request to the assistant API
    const requestBody: { messages: ChatCompletionMessageParam[], hasImage?: boolean } = {
      messages: currentMessages.map(msg => ({ role: msg.role, content: msg.content })) as ChatCompletionMessageParam[],
    };

    if (uploadedImage) {
      requestBody.hasImage = true;
      // Optionally, add a system message or modify the user message to indicate image presence
      // For simplicity, we'll just send the flag for now and handle it on the backend.
    }


    try {
      const response = await fetch('/api/prompt-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), // Send the updated body
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const data = await response.json()
      const aiResponseContent: string = data.response

      // Check for the final prompt tag
      const promptMatch = aiResponseContent.match(/<prompt_en>(.*?)<\/prompt_en>/s)

      if (promptMatch && promptMatch[1]) {
        const finalPrompt = promptMatch[1].trim()
        const confirmationMessage = `Great! Here's the generated English prompt:\n\n${finalPrompt}\n\nYou can use this or edit it further.`

        setMessages([...currentMessages, { role: 'assistant', content: confirmationMessage }])
        // Pass image data along with prompts
        onPromptGenerated(finalPrompt, DEFAULT_NEGATIVE_PROMPT, uploadedImage ?? undefined)
      } else {
        setMessages([...currentMessages, { role: "assistant", content: aiResponseContent }])
      }

    } catch (error: any) {
      console.error("Error calling prompt assistant API:", error)
      // Add an error message to the chat
      setMessages([
        ...currentMessages,
        { role: "assistant", content: `Sorry, an error occurred: ${error.message}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Simplified Reset function
  const handleReset = () => {
    setMessages([initialGreeting]) // Reset to initial English greeting
    setInput("")
    setIsLoading(false)
  }

  const handleSkip = () => {
    // Pass image data when skipping too
    onPromptGenerated("", DEFAULT_NEGATIVE_PROMPT, uploadedImage ?? undefined)
  }

  // Handler for file input change
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset file input
    }
  }


  return (
    <GlassCard className="w-full">
      {/* Header remains largely the same */}
      {/* Remove language dropdown from header */}
      <GlassCardHeader>
        <div>
          <GlassCardTitle>Prompt Assistant</GlassCardTitle>
          <GlassCardDescription>Describe your desired image, or upload one to transform.</GlassCardDescription> {/* Updated description */}
        </div>
        {/* Hidden File Input */}
        <Input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          disabled={isLoading}
        />
        {/* Upload Button */}
        <Button
          variant="outline"
          onClick={triggerFileInput}
          className="border-white/10 text-white hover:bg-white/10"
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadedImage ? "Change Image" : "Upload Image"}
        </Button>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Image Preview Area */}
        {uploadedImage && (
          <div className="relative group w-32 h-32 mx-auto border border-white/20 rounded-md overflow-hidden">
            <Image
              src={uploadedImage}
              alt="Uploaded preview"
              layout="fill"
              objectFit="cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeImage}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        )}
        {/* Chat message display area */}
        <div className="h-[300px] overflow-y-auto space-y-4 p-4 rounded-md border border-white/10 bg-black/20 scrollbar-hide">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${message.role === "assistant" ? "text-emerald-400" : "text-white"}`} // Use emerald for assistant
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-black/30">
                {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 space-y-2">
                <p className="leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {/* Add a ref to scroll to */}
          <div ref={messagesEndRef} />
        </div>
        {/* Input area - simplified placeholder */}
        <div className="flex items-center space-x-2">
          <Textarea
            placeholder={"Type your answer..."} // Always English placeholder
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            className="flex-1 bg-black/20 border-white/10 text-white placeholder:text-white/50" // Added placeholder style
            disabled={isLoading} // Disable input while loading
          />
          <Button size="icon" onClick={handleSendMessage} className="bg-primary hover:bg-primary/80" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </GlassCardContent>
      {/* Footer buttons */}
      <GlassCardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSkip} className="border-white/10 text-white hover:bg-white/10" disabled={isLoading}>
          Skip Assistant
        </Button>
        <Button variant="default" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
      </GlassCardFooter>
    </GlassCard>
  )
}
