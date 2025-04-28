"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ImageIcon, Video, CreditCard, HelpCircle, BookOpen, ShieldAlert, Clock } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export function NavLinks() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if the current user is an admin
    const checkAdminStatus = async () => {
      if (!user) return

      try {
        const response = await fetch("/api/admin/check-access")
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin || false)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    checkAdminStatus()
  }, [user])

  const links = [
    {
      name: "Images",
      href: "/",
      icon: <ImageIcon className="h-5 w-5 mr-2" />,
    },
    {
      name: "Gallery",
      href: "/gallery",
      icon: <ImageIcon className="h-5 w-5 mr-2" />,
    },
    {
      name: "Video",
      href: "/video",
      icon: <Video className="h-5 w-5 mr-2" />,
    },
    {
      name: "Subscription",
      href: "/subscription",
      icon: <CreditCard className="h-5 w-5 mr-2" />,
    },
    {
      name: "AI Models",
      href: "/ai-models",
      icon: <BookOpen className="h-5 w-5 mr-2" />,
    },
    {
      name: "Usage Guide",
      href: "/usage-guide",
      icon: <HelpCircle className="h-5 w-5 mr-2" />,
    },
    {
      name: "Coming Soon",
      href: "/coming-soon",
      icon: <Clock className="h-5 w-5 mr-2" />,
    },
  ]

  // Add admin link if user is an admin
  const allLinks = [...links]

  if (isAdmin) {
    allLinks.push({
      name: "Admin",
      href: "/admin/subscriptions",
      icon: <ShieldAlert className="h-5 w-5 mr-2" />,
    })
  }

  return (
    <nav className="flex items-center space-x-6 overflow-x-auto pb-2 scrollbar-hide">
      {allLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center text-base font-medium transition-colors hover:text-primary whitespace-nowrap",
            pathname === link.href || pathname.startsWith(link.href + "/") ? "text-primary" : "text-muted-foreground",
          )}
        >
          {link.icon}
          {link.name}
        </Link>
      ))}
    </nav>
  )
}
