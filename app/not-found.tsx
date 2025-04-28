import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui-overrides' // Assuming GlassCard is appropriate

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <GlassCard className="w-full max-w-md text-center">
        <GlassCardHeader>
          <GlassCardTitle className="text-4xl font-bold text-white">404</GlassCardTitle>
          <GlassCardDescription className="text-white/70 mt-2">Page Not Found</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <p className="text-white/90">Oops! The page you are looking for does not exist or has been moved.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
