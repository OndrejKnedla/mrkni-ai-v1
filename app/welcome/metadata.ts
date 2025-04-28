import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

// Add specific metadata for the Welcome/Coming Soon page
export const metadata: Metadata = {
  title: `Coming Soon - ${siteConfig.name}`,
  description: `Get ready for ${siteConfig.name}! Sign up for exclusive early access, bonus credits, and be the first to experience our revolutionary AI image and video generator.`,
  openGraph: {
    title: `Coming Soon - ${siteConfig.name}`,
    description: `Get ready for ${siteConfig.name}! Sign up for exclusive early access, bonus credits, and be the first to experience our revolutionary AI image and video generator.`,
    url: `${siteConfig.url}/welcome`, // Specific URL for this page
    images: [
      {
        url: siteConfig.ogImage, // Can use the main OG image or create a specific one
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Coming Soon`,
      },
    ],
  },
  twitter: {
    title: `Coming Soon - ${siteConfig.name}`,
    description: `Get ready for ${siteConfig.name}! Sign up for exclusive early access, bonus credits, and be the first to experience our revolutionary AI image and video generator.`,
    images: [siteConfig.ogImage],
  },
}
