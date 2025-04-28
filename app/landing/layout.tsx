import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/context/theme-context"
import { siteConfig } from "@/lib/config"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: `Coming Soon | ${siteConfig.name}`,
  description: "Sign up to be notified when we launch our AI image and video generation platform",
  openGraph: {
    title: `Coming Soon | ${siteConfig.name}`,
    description: "Sign up to be notified when we launch our AI image and video generation platform",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Coming Soon | ${siteConfig.name}`,
    description: "Sign up to be notified when we launch our AI image and video generation platform",
    images: [siteConfig.ogImage],
  },
}

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
