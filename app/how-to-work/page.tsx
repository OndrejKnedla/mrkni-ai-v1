"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HowToWorkRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/ai-models")
  }, [router])

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <p className="text-white">Redirecting to AI Models page...</p>
    </div>
  )
}
