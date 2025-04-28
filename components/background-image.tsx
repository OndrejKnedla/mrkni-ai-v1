"use client"

import { useEffect, useState } from "react"
import { Image } from "@/components/ui/image"

// Sample background images (you can replace these with actual AI-generated images)
const backgroundImages = [
  "/placeholder/image.svg",
  "/placeholder/image.svg",
  "/placeholder/image.svg",
]

export function BackgroundImage() {
  const [currentImage, setCurrentImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Change background image every 10 seconds
    const interval = setInterval(() => {
      setIsLoading(true)
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {backgroundImages.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentImage === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-black/50 z-10" />
          <Image
            src={src || ""}
            alt="Background"
            fill
            className="object-cover"
            priority={index === 0}
            fallbackSrc="/placeholder/image.svg"
            onLoadingComplete={handleImageLoad}
          />
        </div>
      ))}
    </div>
  )
}
