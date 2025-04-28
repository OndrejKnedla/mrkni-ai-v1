import { siteConfig } from "@/lib/config"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className="flex items-center space-x-2 text-white">
      <Sparkles className="h-7 w-7 text-emerald-400" />
      <span className={cn("font-bold text-xl", className)}>{siteConfig.name}</span>
    </Link>
  )
}
