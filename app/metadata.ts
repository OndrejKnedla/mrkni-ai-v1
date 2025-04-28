import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

// Add specific metadata for the homepage
export const metadata: Metadata = {
  title: `${siteConfig.name} - AI Image and Video Generator`, // More specific title
  description: `Generate stunning, unique images and videos from text prompts using advanced AI models on ${siteConfig.name}. Explore various artistic styles and high-resolution outputs.`, // More detailed description
  openGraph: {
    title: `${siteConfig.name} - AI Image and Video Generator`,
    description: `Generate stunning, unique images and videos from text prompts using advanced AI models on ${siteConfig.name}. Explore various artistic styles and high-resolution outputs.`,
    url: siteConfig.url, // Use the main site URL for the homepage OG URL
    images: [
      {
        url: siteConfig.ogImage, // Use the main OG image
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} AI Generator`,
      },
    ],
  },
  twitter: {
    title: `${siteConfig.name} - AI Image and Video Generator`,
    description: `Generate stunning, unique images and videos from text prompts using advanced AI models on ${siteConfig.name}. Explore various artistic styles and high-resolution outputs.`,
    images: [siteConfig.ogImage],
  },
}
