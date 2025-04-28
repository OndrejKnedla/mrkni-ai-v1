"use client"

import React, { useState } from 'react'
import NextImage, { ImageProps as NextImageProps } from 'next/image'
import { validateAndFixImageUrl, isValidImageUrl, isSupabaseStorageUrl, addCacheBustingParameter } from '@/lib/utils/image-url-utils'

export interface ImageProps extends Omit<NextImageProps, 'onError'> {
  fallbackSrc?: string
  useProxy?: boolean
}

// Function to convert a URL to a proxied URL
const getProxiedImageUrl = (url: string): string => {
  // Only proxy external URLs (not local ones)
  if (!url || url.startsWith('/') || url.startsWith('data:')) {
    return url
  }

  // Special handling for Supabase Storage URLs - don't proxy these
  if (isSupabaseStorageUrl(url)) {
    // Use our utility to validate and fix the URL
    const fixedUrl = validateAndFixImageUrl(url)
    return fixedUrl
  }

  try {
    // Base64 encode the URL to avoid issues with special characters
    const encodedUrl = btoa(encodeURIComponent(url))
    return `/api/image-proxy?url=${encodedUrl}`
  } catch (error) {
    console.error(`Error encoding URL for proxy: ${url}`, error)
    return url // Return original URL if encoding fails
  }
}

export function Image({
  src,
  alt,
  fallbackSrc = "/placeholder/image.svg",
  useProxy = true,
  ...props
}: ImageProps) {
  const [error, setError] = useState(false)
  const [attemptedExtensions, setAttemptedExtensions] = useState<string[]>([])

  // Handle when src is an object (StaticImageData) or empty/invalid
  const sourceSrc = typeof src === 'string' ? src : src?.src || ''

  // Validate URL - check if it's not empty and is a valid URL format
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;

    // Special handling for Supabase Storage URLs
    if (isSupabaseStorageUrl(url)) {
      return true;
    }

    // Use our utility function for validation
    return isValidImageUrl(url);
  }

  // Function to try alternative file extensions
  const tryAlternativeExtension = (url: string): string | null => {
    // Only process local image URLs from the images-ai folder
    if (!url.includes('/images/images-ai/') || !url.includes('.')) {
      return null
    }

    // Get the base path and current extension
    const lastDotIndex = url.lastIndexOf('.')
    const basePath = url.substring(0, lastDotIndex)
    const currentExt = url.substring(lastDotIndex + 1)

    // List of extensions to try
    const extensions = ['webp', 'jpg', 'jpeg', 'png', 'svg']

    // Filter out the current extension and any already attempted
    const extensionsToTry = extensions.filter(
      ext => ext !== currentExt && !attemptedExtensions.includes(ext)
    )

    // If we have extensions to try, use the first one
    if (extensionsToTry.length > 0) {
      const newExt = extensionsToTry[0]
      // Add this extension to attempted list
      setAttemptedExtensions([...attemptedExtensions, newExt])
      return `${basePath}.${newExt}`
    }

    return null
  }

  // Determine the actual source to use
  const [actualSrc, setActualSrc] = useState<string>(() => {
    // If source is invalid, use fallback immediately
    if (!sourceSrc || sourceSrc === '' || !isValidUrl(sourceSrc)) {
      return fallbackSrc
    }
    return useProxy && typeof sourceSrc === 'string' ? getProxiedImageUrl(sourceSrc) : sourceSrc
  })

  const handleError = () => {
    if (!error) {
      // Removed console.log statements to reduce console noise

      // Special handling for Supabase Storage URLs
      if (typeof sourceSrc === 'string' && isSupabaseStorageUrl(sourceSrc)) {
        // Try fixing the URL with our utility
        const fixedUrl = validateAndFixImageUrl(sourceSrc)
        if (fixedUrl !== sourceSrc) {
          setActualSrc(fixedUrl)
          return
        }

        // If already fixed, try direct URL without proxy
        if (useProxy) {
          setActualSrc(sourceSrc) // Use direct URL without proxy
          return
        }

        // Try adding a cache-busting parameter
        const cacheBustUrl = addCacheBustingParameter(sourceSrc)
        setActualSrc(cacheBustUrl)
        return
      }

      // Try alternative extensions first
      if (typeof sourceSrc === 'string') {
        const alternativeSrc = tryAlternativeExtension(sourceSrc)
        if (alternativeSrc) {
          const newSrc = useProxy ? getProxiedImageUrl(alternativeSrc) : alternativeSrc
          setActualSrc(newSrc)
          return
        }
      }

      // If no alternatives or all failed, use fallback
      setError(true)
      setActualSrc(fallbackSrc)
    }
  }

  // Update source when props change
  React.useEffect(() => {
    // Reset error state and attempted extensions when source changes
    setError(false)
    setAttemptedExtensions([])

    // Special handling for Supabase Storage URLs
    if (typeof sourceSrc === 'string' && isSupabaseStorageUrl(sourceSrc)) {
      // Use our utility to validate and fix the URL
      const fixedUrl = validateAndFixImageUrl(sourceSrc)
      setActualSrc(fixedUrl)

      // Force a reload of the image after a short delay
      // This helps with images that might not load immediately
      setTimeout(() => {
        if (!error) {
          const tempSrc = addCacheBustingParameter(fixedUrl)
          setActualSrc(tempSrc)
        }
      }, 500)

      return
    }

    // If source is invalid, use fallback immediately
    if (!sourceSrc || sourceSrc === '' || !isValidUrl(sourceSrc)) {
      setActualSrc(fallbackSrc)
      setError(true)
    } else if (!error) {
      const newSrc = useProxy && typeof sourceSrc === 'string' ? getProxiedImageUrl(sourceSrc) : sourceSrc
      setActualSrc(newSrc)
    }
  }, [src, sourceSrc, fallbackSrc, useProxy]) // Remove error from dependencies to prevent loops

  return (
    <NextImage
      {...props}
      src={error ? fallbackSrc : actualSrc}
      alt={alt}
      onError={handleError}
    />
  )
}

export default Image
