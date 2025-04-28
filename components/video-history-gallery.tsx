"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { HistoryItem } from "@/lib/types"
import { Clock, Trash, RefreshCw, Play } from "lucide-react"
// Image component not needed for videos
import { useHistory } from "@/context/history-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "./ui-overrides"

interface VideoHistoryGalleryProps {
  onSelectItem: (item: HistoryItem) => void
}

export function VideoHistoryGallery({ onSelectItem }: VideoHistoryGalleryProps) {
  const { history, loading, clearHistory, removeFromHistory, refreshHistory } = useHistory()

  // Create a state to store unique video items
  const [uniqueItems, setUniqueItems] = useState<HistoryItem[]>([])

  // Process history to ensure uniqueness whenever history changes
  useEffect(() => {
    // Use a Map to ensure uniqueness by ID
    const uniqueItemsMap = new Map<string, HistoryItem>()

    // Process each item, only adding it if its ID hasn't been seen before and it's a video
    history.forEach(item => {
      if (item && item.id && item.type === 'video') {
        // Only add items that have output
        if (item.output && item.output.length > 0 && item.output[0]) {
          uniqueItemsMap.set(item.id, item)
        }
      }
    })

    // Convert the map values back to an array and sort by created_at (newest first)
    const uniqueItemsList = Array.from(uniqueItemsMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`Processed ${history.length} items into ${uniqueItemsList.length} unique video items`)
    setUniqueItems(uniqueItemsList)
  }, [history])

  // Loading state
  if (loading) {
    return (
      <GlassCard className="w-full">
        <GlassCardHeader>
          <GlassCardTitle>Generation History</GlassCardTitle>
          <GlassCardDescription>Loading your video history...</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-300 mt-4">Loading history...</p>
          </div>
        </GlassCardContent>
      </GlassCard>
    )
  }

  // Empty history state
  if (uniqueItems.length === 0) {
    return (
      <GlassCard className="w-full">
        <GlassCardHeader>
          <GlassCardTitle>Generation History</GlassCardTitle>
          <GlassCardDescription>Your video history will appear here</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Clock className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-300">No video history yet</p>
          </div>
        </GlassCardContent>
      </GlassCard>
    )
  }

  // Main gallery view
  return (
    <GlassCard className="w-full">
      <GlassCardHeader className="flex flex-row items-center justify-between">
        <div>
          <GlassCardTitle>Generation History</GlassCardTitle>
          <GlassCardDescription>Your previous video generations</GlassCardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={refreshHistory} className="text-white hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </GlassCardHeader>
      <GlassCardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
            {uniqueItems.map((item) => (
              <div key={`unique-${item.id}`} className="relative group">
                <div
                  className="relative aspect-video rounded-md overflow-hidden cursor-pointer bg-black/30"
                  onClick={() => onSelectItem(item)}
                >
                  {/* Video content */}
                  {item.output && item.output.length > 0 && (
                    <>
                      <video
                        src={item.output[0]}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </>
                  )}

                  {/* Prompt overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                    <p className="text-white text-center text-[10px] leading-tight line-clamp-3">{item.input.prompt}</p>
                  </div>
                </div>

                {/* Delete button */}
                <div className="absolute top-1 right-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromHistory(item.id)
                    }}
                  >
                    <Trash className="h-3 w-3" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>

                {/* Metadata */}
                <div className="absolute bottom-1 left-1 flex flex-col gap-1">
                  <span className="text-[10px] bg-black/60 text-white px-1 py-0.5 rounded">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                  {item.model && (
                    <span className="text-[10px] bg-black/60 text-white px-1 py-0.5 rounded">
                      {item.model}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </GlassCardContent>
      <GlassCardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-white/10 bg-black/20 text-white hover:bg-white/10"
          onClick={clearHistory}
        >
          Clear History
        </Button>
      </GlassCardFooter>
    </GlassCard>
  )
}
