"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CountdownTimer } from "@/components/countdown-timer"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { ParticleNetworkBackground } from "@/components/particle-network-background"
import { Logo } from "@/components/logo"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui-overrides"
import { siteConfig } from "@/lib/config"

// Set your launch date here
const LAUNCH_DATE = new Date("2024-08-01T00:00:00Z") // August 1, 2024

export default function ComingSoonPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/register-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setEmail("")
        setName("")
      } else {
        setMessage({ type: "error", text: data.error || "Failed to register interest" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ParticleNetworkBackground />
      
      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center z-10">
        <div className="text-center mb-8">
          <Logo className="text-4xl mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4">
            Coming Soon
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            We're working hard to bring you the ultimate AI image and video generation experience.
            Sign up to be notified when we launch!
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="flex items-center justify-center">
            <CountdownTimer targetDate={LAUNCH_DATE} />
          </div>

          <div>
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Get Notified</GlassCardTitle>
                <GlassCardDescription>
                  Be the first to know when we launch
                </GlassCardDescription>
              </GlassCardHeader>
              <form onSubmit={handleSubmit}>
                <GlassCardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Name (optional)</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-black/20 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/20 border-white/10 text-white"
                    />
                  </div>
                  
                  {message && (
                    <div className={`p-3 rounded-md flex items-start ${
                      message.type === "success" ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
                    }`}>
                      {message.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      )}
                      <span>{message.text}</span>
                    </div>
                  )}
                </GlassCardContent>
                <GlassCardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Notify Me"
                    )}
                  </Button>
                </GlassCardFooter>
              </form>
            </GlassCard>
          </div>
        </div>

        <div className="text-center text-white/60 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">What to Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FeatureCard 
              title="AI Image Generation" 
              description="Create stunning images with state-of-the-art AI models" 
            />
            <FeatureCard 
              title="AI Video Creation" 
              description="Transform your ideas into captivating videos" 
            />
            <FeatureCard 
              title="Easy to Use" 
              description="Simple interface designed for both beginners and experts" 
            />
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 py-4 bg-black/30 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 text-center text-sm text-gray-300">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  )
}
