"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useHistory } from "@/context/history-context"
import { Loader2, RefreshCw, Tool, WrenchIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui-overrides"

export default function DebugPage() {
  const { user, loading: authLoading } = useAuth()
  const { history, loading: historyLoading, refreshHistory } = useHistory()
  const [rawData, setRawData] = useState<string>("")
  const [fixingImages, setFixingImages] = useState(false)
  const { toast } = useToast()

  const fixImageUrls = async () => {
    if (!user) return

    try {
      setFixingImages(true)
      const response = await fetch('/api/debug-images')

      if (!response.ok) {
        throw new Error('Failed to fix image URLs')
      }

      const data = await response.json()

      toast({
        title: 'Image URLs Fixed',
        description: `Fixed ${data.fixedUrls} image URLs out of ${data.images} total images.`,
        duration: 5000,
      })

      // Refresh history to show the fixed images
      await refreshHistory()
    } catch (error) {
      console.error('Error fixing image URLs:', error)
      toast({
        title: 'Error',
        description: 'Failed to fix image URLs. See console for details.',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setFixingImages(false)
    }
  }

  useEffect(() => {
    if (history.length > 0) {
      const debugData = history.map(item => ({
        id: item.id,
        type: item.type,
        model: item.model,
        input_model: item.input.model,
        created_at: item.created_at,
        output: item.output,
        status: item.status
      }))
      setRawData(JSON.stringify(debugData, null, 2))
    } else {
      setRawData("No history items found")
    }
  }, [history])

  if (authLoading || historyLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[60vh] justify-center">
        <GlassCard className="w-full max-w-md">
          <GlassCardHeader>
            <GlassCardTitle>Authentication Required</GlassCardTitle>
            <GlassCardDescription>Please sign in to view debug information</GlassCardDescription>
          </GlassCardHeader>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GlassCard className="w-full">
        <GlassCardHeader className="flex flex-row items-center justify-between">
          <div>
            <GlassCardTitle>Debug Information</GlassCardTitle>
            <GlassCardDescription>Raw history data for debugging</GlassCardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fixImageUrls}
              disabled={fixingImages}
              className="text-white hover:bg-white/10"
            >
              {fixingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <WrenchIcon className="h-4 w-4 mr-2" />
                  Fix Image URLs
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={refreshHistory} className="text-white hover:bg-white/10">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="bg-black/20 p-4 rounded-md overflow-auto max-h-[70vh]">
            <pre className="text-xs text-white">{rawData}</pre>
          </div>
          <div className="mt-4">
            <h3 className="text-white font-medium mb-2">History Items: {history.length}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, index) => (
                <div key={item.id} className="bg-black/20 p-4 rounded-md">
                  <h4 className="text-white font-medium">Item {index + 1}: {item.id.substring(0, 8)}...</h4>
                  <p className="text-sm text-gray-300">Type: {item.type || 'unknown'}</p>
                  <p className="text-sm text-gray-300">Model: {item.model || item.input.model}</p>
                  <p className="text-sm text-gray-300">Status: {item.status}</p>
                  <p className="text-sm text-gray-300">Created: {new Date(item.created_at).toLocaleString()}</p>
                  {item.output && item.output.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">Output URLs:</p>
                      <ul className="text-xs text-gray-400 list-disc pl-4 mt-1 space-y-1">
                        {item.output.map((url, urlIndex) => (
                          <li key={urlIndex} className="break-all">
                            {url.substring(0, 50)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400 mt-2">No output URLs</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
