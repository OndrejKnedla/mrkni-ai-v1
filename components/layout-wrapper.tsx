"use client"

import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/auth/user-nav"
import { NavLinks } from "@/components/nav-links"
import { siteConfig } from "@/lib/config"
import Link from "next/link"
import { ParticleNetworkBackground } from "@/components/particle-network-background"

// Flag to control coming soon mode
const COMING_SOON_MODE = true; // Enable coming soon mode for live deployment

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  // Get current pathname
  const pathname = usePathname();

  // Check if we're on the welcome page
  const isWelcomePage = pathname === '/welcome';

  // Hide header and footer if in coming soon mode and on welcome page
  const hideHeaderFooter = COMING_SOON_MODE && isWelcomePage;

  return (
    <>
      {/* Use the interactive particle background on all pages */}
      <ParticleNetworkBackground />

      <div className="relative min-h-screen flex flex-col z-10 pointer-events-none">

      {/* Hide header if on welcome page during coming soon mode */}
      {!hideHeaderFooter && (
        <header className="border-b border-white/10 bg-black/30 backdrop-blur-md pointer-events-auto">
          <div className="container mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Logo className="text-2xl" />
              <NavLinks />
            </div>
            <div className="flex items-center space-x-2">
              <UserNav />
            </div>
          </div>
        </header>
      )}

      {/* Apply flex-1 only if not on the welcome page */}
      <main className={`${!isWelcomePage ? 'flex-1' : ''} pointer-events-auto`}>{children}</main>

      {/* Footer - Always visible */}
      {/* {!hideHeaderFooter && ( */}
        <footer className="border-t border-white/10 py-12 bg-black/30 backdrop-blur-md pointer-events-auto"> {/* Reverted py-16 to py-12 */}
          <div className="container mx-auto px-4 text-center text-base text-gray-300"> {/* Kept text-base */}
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            {/* <p className="mt-1">Powered by Flux AI models from Replicate.</p> */}
            {/* <div className="mt-2 text-xs"> */}
              {/* <Link href="/terms-of-service" className="text-gray-400 hover:text-primary mx-2"> */}
                {/* Terms */}
              {/* </Link> */}
              {/* <Link href="/privacy-policy" className="text-gray-400 hover:text-primary mx-2"> */}
                {/* Privacy */}
              {/* </Link> */}
              {/* <Link href="/cookie-policy" className="text-gray-400 hover:text-primary mx-2"> */}
                {/* Cookies */}
              {/* </Link> */}
            {/* </div> */}
          </div>
        </footer>
      {/* )} */}
    </div>
    </>
  )
}
