"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Override Card component to add glass effect
export function GlassCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("glass-card", className)} {...props} />
}

export function GlassCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("text-on-bg", className)} {...props} />
}

export function GlassCardTitle({ className, ...props }: React.ComponentProps<typeof CardTitle>) {
  return <CardTitle className={cn("text-on-bg", className)} {...props} />
}

export function GlassCardDescription({ className, ...props }: React.ComponentProps<typeof CardDescription>) {
  return <CardDescription className={cn("text-white/70", className)} {...props} />
}

export function GlassCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn(className)} {...props} />
}

export function GlassCardFooter({ className, ...props }: React.ComponentProps<typeof CardFooter>) {
  return <CardFooter className={cn(className)} {...props} />
}
