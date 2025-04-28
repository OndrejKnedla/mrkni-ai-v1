"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Youtube } from "lucide-react"
import { TikTokIcon } from "@/components/icons/tiktok-icon"
import { ParticleNetworkBackground } from "@/components/particle-network-background"
import { siteConfig } from "@/lib/config"

// Set launch date to April 21, 2024
const LAUNCH_DATE = new Date("2024-04-21T00:00:00Z")

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    // Calculate time remaining
    const calculateTimeLeft = () => {
      const difference = +LAUNCH_DATE - +new Date()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        // Launch date has passed
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        })
      }
    }

    // Initial calculation
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    // Cleanup
    return () => clearInterval(timer)
  }, [])

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
        setMessage({ type: "success", text: data.message || "Thank you for registering! We'll notify you when we launch." })
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
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-black relative">
      {/* Original Particle Network Background */}
      <ParticleNetworkBackground />

      <div className="w-full max-w-5xl mx-auto z-10 text-center">
        {/* Logo and Title */}
        <div className="mb-8 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-emerald-400 mr-2" />
          <h1 className="text-4xl font-bold text-white">MrkniAI</h1>
        </div>

        {/* Coming Soon */}
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Coming Soon
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
          We're working hard to bring you the ultimate AI image and video
          generation experience. Sign up to be notified when we launch!
        </p>

        {/* Countdown and Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Countdown Timer */}
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-white mb-6">We're Live!</h3>
            <div className="grid grid-cols-4 gap-4">
              <TimeUnit value={timeLeft.days} label="Days" />
              <TimeUnit value={timeLeft.hours} label="Hours" />
              <TimeUnit value={timeLeft.minutes} label="Minutes" />
              <TimeUnit value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Get Notified</h3>
            <p className="text-white/70 mb-6">Be the first to know when we launch</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
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

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
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
            </form>
          </div>
        </div>

        {/* What to Expect */}
        <h2 className="text-3xl font-bold text-white mb-8">What to Expect</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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

        {/* Social Media Links */}
        <div className="flex justify-center space-x-6 mb-12">
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full p-3 hover:bg-white/10 transition-colors"
          >
            <Youtube className="h-6 w-6 text-white" />
            <span className="sr-only">YouTube</span>
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full p-3 hover:bg-white/10 transition-colors"
          >
            <TikTokIcon className="h-6 w-6 text-white" />
            <span className="sr-only">TikTok</span>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-white/60 text-sm">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </div>
  )
}

interface TimeUnitProps {
  value: number
  label: string
}

function TimeUnit({ value, label }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black/30 text-white text-2xl font-bold rounded-md w-full py-3 text-center">
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-white/70 text-sm mt-2">{label}</span>
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
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  )
}
