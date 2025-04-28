"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, AlertCircle, Sparkles, YoutubeIcon, Clock, Gem, Gift, Image, Film, Wrench } from "lucide-react"
import { TikTokIcon } from "@/components/icons/tiktok-icon"
import { siteConfig } from "@/lib/config"
import Link from "next/link"

// Re-define helper components here or import if they become shared
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
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-left">
      {icon}
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  )
}


// Set launch date to April 25, 2025
const LAUNCH_DATE = new Date("2025-04-25T00:00:00Z") // Updated date

export default function WelcomeClientContent() {
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

    if (!email) {
      setMessage({ type: "error", text: "Email is required" })
      setIsSubmitting(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "Invalid email format" })
      setIsSubmitting(false)
      return
    }

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
      console.error("Error submitting form:", error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto z-10 text-center">
      {/* Logo and Title */}
      <div className="mb-8 flex items-center justify-center">
        <Sparkles className="h-12 w-12 text-emerald-400 mr-3" />
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

      {/* Countdown Timer - Full Width */}
      <div className="w-full max-w-3xl mx-auto mb-12 bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Launching In:</h3>
        <div className="grid grid-cols-4 gap-4">
          <TimeUnit value={timeLeft.days} label="Days" />
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>
      </div>

      {/* Compelling Features Section */}
      <div className="w-full mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Unlock the Power of AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <FeatureCard
            icon={<Clock className="h-6 w-6 text-emerald-400 mb-3" />}
            title="Exclusive Early Access"
            description="Sign up now to get priority access to our platform before the public launch"
          />
          <FeatureCard
            icon={<Gem className="h-6 w-6 text-emerald-400 mb-3" />}
            title="Premium Features"
            description="Early subscribers will receive bonus credits and access to premium AI models"
          />
          <FeatureCard
            icon={<Gift className="h-6 w-6 text-emerald-400 mb-3" />}
            title="Limited Time Offer"
            description="Secure your spot and enjoy exclusive launch-day benefits available only to early birds."
          />
        </div>
      </div>

      {/* Registration Form - Full Width */}
      <div className="w-full max-w-3xl mx-auto mb-16 bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Get Notified</h3>
        <p className="text-white/70 mb-6">Be the first to know when we launch and receive your free AI image credits</p>

        <div className="mb-6 p-5 bg-emerald-900/40 border border-emerald-500/40 rounded-lg text-center">
          <h4 className="font-bold text-emerald-400 mb-3 text-xl">Early Subscriber Benefit</h4>
          <div className="inline-block bg-emerald-500/30 px-6 py-3 rounded-full text-white text-lg font-semibold">
            50 FREE AI Image Generation Credits
          </div>
        </div>

        <form id="notify-form" onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-lg py-6 shadow-lg shadow-emerald-700/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>Get 50 Free Credits <span className="ml-2 text-xs bg-emerald-500/30 px-2 py-1 rounded-full">Limited Time</span></>
            )}
          </Button>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-white/70">No spam, we promise. Unsubscribe anytime.</p>
          </div>
        </form>
      </div>

      {/* What to Expect - Enhanced with more details */}
      <h2 className="text-3xl font-bold text-white mb-8">Revolutionary AI Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <FeatureCard
          icon={<Image className="h-6 w-6 text-emerald-400 mb-3" />}
          title="State-of-the-Art Image Generation"
          description="Generate stunning visuals with access to over 20 premium AI models, including Stable Diffusion 3, Flux Pro, Imagen, and more."
        />
        <FeatureCard
          icon={<Film className="h-6 w-6 text-emerald-400 mb-3" />}
          title="Advanced Video Creation"
          description="Transform images into videos or create videos from text with cutting-edge AI technology"
        />
        <FeatureCard
          icon={<Wrench className="h-6 w-6 text-emerald-400 mb-3" />}
          title="Professional Tools"
          description="Advanced prompt engineering, image editing, and customization options for perfect results"
        />
      </div>

      {/* Testimonials Section */}
      <div className="w-full max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">What Early Testers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <p className="text-white/80 italic mb-4">"MrkniAI has completely transformed my creative workflow. The quality of images I can generate is mind-blowing!"</p>
            <p className="text-white font-semibold">— David K., Digital Artist</p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <p className="text-white/80 italic mb-4">"Generating engaging clips for YouTube Shorts and TikTok has never been faster. The AI video tools are perfect for creating eye-catching content quickly!"</p>
            <p className="text-white font-semibold">— Alex R., Social Media Manager</p>
          </div>
        </div>
      </div>

      {/* Social Media Links moved to parent Server Component (app/welcome/page.tsx) */}
    </div>
  )
}
