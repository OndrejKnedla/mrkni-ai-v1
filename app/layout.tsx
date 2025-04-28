import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/context/theme-context"
import { AuthProvider } from "@/context/auth-context"
import { HistoryProvider } from "@/context/history-context"
import { SubscriptionProvider } from "@/context/subscription-context"

import { siteConfig } from "@/lib/config"
import { LayoutWrapper } from "@/components/layout-wrapper"
import Script from 'next/script' // Import Script component for JSON-LD
import { Analytics } from "@vercel/analytics/react" // Import Vercel Analytics

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url), // Set the base URL
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`, // Template for page-specific titles
  },
  description: siteConfig.description,
  // generator: 'v0.dev', // Removed unnecessary generator tag
  icons: {
    icon: '/images/favicon/favicon.ico', // Favicon.ico
    shortcut: '/images/favicon/favicon.ico', // Older browsers
    apple: '/images/favicon/apple-touch-icon.png', // Apple touch icon
    other: [ // Other icons including different sizes
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/images/favicon/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/images/favicon/favicon-16x16.png' },
    ],
  },
  manifest: '/images/favicon/site.webmanifest', // Web App Manifest

  // Open Graph Metadata
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage, // Must be an absolute URL
        width: 1200, // Specify image dimensions
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: 'en_US', // Specify locale
    type: 'website',
  },

  // Twitter Card Metadata
  twitter: {
    card: 'summary_large_image', // Use 'summary_large_image' for better visibility
    title: siteConfig.name,
    description: siteConfig.description,
    // site: '@YourTwitterHandle', // Optional: Add your Twitter handle
    // creator: '@YourTwitterHandle', // Optional: Add creator's Twitter handle
    images: [siteConfig.ogImage], // Must be an absolute URL
  },

  // Optional: Add more specific metadata if needed
  // keywords: ['AI image generation', 'text-to-image', 'stable diffusion', 'AI art'],
  // authors: [{ name: 'Your Name', url: 'Your URL' }],
  // viewport: 'width=device-width, initial-scale=1', // Next.js handles this by default
}

// Function to generate JSON-LD structured data
function generateStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [ // Use @graph for multiple types
      {
        "@type": "WebSite",
        "name": siteConfig.name,
        "url": siteConfig.url,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${siteConfig.url}/search?q={search_term_string}`, // Example search endpoint
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": siteConfig.name,
        "url": siteConfig.url,
        "logo": {
          "@type": "ImageObject",
          // Ensure you have a logo image at this path or update the URL
          "url": `${siteConfig.url}/images/favicon/android-chrome-192x192.png`,
          "width": 192,
          "height": 192
        },
        // Add social links if available in siteConfig
        "sameAs": [
          siteConfig.links.github,
          siteConfig.links.twitter
          // Add other social profile URLs here
        ].filter(Boolean) // Filter out any undefined links
      }
    ]
  };
  return JSON.stringify(data);
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <SubscriptionProvider>
              <HistoryProvider>
                {/* LayoutWrapper handles conditional header/footer rendering and background */}
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </HistoryProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* Add JSON-LD script using next/script */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateStructuredData() }}
        />
        {/* Microsoft Clarity Script */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive" // Load after the page becomes interactive
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "r4g3gpap53");
            `,
          }}
        />
        <Analytics /> {/* Add Vercel Analytics component */}
      </body>
    </html>
  )
}
