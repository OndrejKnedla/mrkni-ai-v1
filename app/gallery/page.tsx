"use client"

import { useState, useEffect } from "react"
// Removed Metadata type import
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context";
// Import removeFromHistory from useHistory hook
import { useHistory } from "@/context/history-context";
import type { HistoryItem } from "@/lib/types";
// Import icons for new buttons
import { Image } from "@/components/ui/image"
import { Loader2, Clock, RefreshCw, RotateCw, Video as VideoIcon, Download, Share2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter, // Import GlassCardFooter
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui-overrides";

// Removed metadata export as it's not allowed in Client Components
// export const metadata: Metadata = { ... }

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  // Include refreshHistory and removeFromHistory functions
  const { history, loading: historyLoading, refreshHistory, removeFromHistory } = useHistory();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [forceReloading, setForceReloading] = useState(false);
  const { toast } = useToast()

  // State for unique gallery items (images and videos)
  const [galleryItems, setGalleryItems] = useState<HistoryItem[]>([])

  // Function to force reload all items (rename for clarity)
  const forceReloadItems = async () => {
    setForceReloading(true)

    try {
      // First refresh the history
      await refreshHistory()

      // Clear localStorage and reload the page
      toast({
        title: "Force Reloading Gallery",
        description: "Clearing cache and reloading page...",
        duration: 3000,
      })

      // Wait a moment for the toast to show
      setTimeout(() => {
        // Force reload the page
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error force reloading gallery:", error)
      setForceReloading(false)

      toast({
        title: "Error",
        description: "Failed to force reload gallery. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Process history to get unique gallery items (images and videos)
  useEffect(() => {
    const uniqueItemsMap = new Map<string, HistoryItem>()
    history.forEach(item => {
      // Filter for items with a valid output URL (image or video)
      if (item && item.id && (item.type === 'image' || item.type === 'video') && Array.isArray(item.output) && item.output.length > 0 && typeof item.output[0] === 'string' && item.output[0].trim() !== '') {
        // Ensure type is set, default to 'image' if missing (for legacy items)
        item.type = item.type || 'image';
        uniqueItemsMap.set(item.id, item)
      }
    })

    const uniqueItemsList = Array.from(uniqueItemsMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`Processed ${history.length} history items into ${uniqueItemsList.length} unique gallery items`)
    setGalleryItems(uniqueItemsList) // Update state name

    // Reset selected item if it's no longer in the list
    if (selectedItem && !uniqueItemsMap.has(selectedItem.id)) {
        setSelectedItem(null);
    } else if (!selectedItem && uniqueItemsList.length > 0) {
        // Select the first item by default if nothing is selected
        setSelectedItem(uniqueItemsList[0]);
    }

  }, [history, selectedItem]) // Keep selectedItem dependency

  // Removed getOriginalUrl, handleDownload, handleShare as they are no longer used
  /*
  // Helper to get original URL...
  const getOriginalUrl = (url: string): string => { ... }
  const handleDownload = (item: HistoryItem) => { ... }
  const handleShare = async (item: HistoryItem) => { ... }
  */

  // --- Loading and Auth States ---
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
            <GlassCardDescription>Please sign in to view your gallery</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="flex justify-center">
            <Link href="/"><Button>Go to Sign In</Button></Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  // --- Main Gallery Render ---
  return (
      <div className="container mx-auto px-4 py-8 max-w-full lg:max-w-screen-2xl">
        {/* Removed overall title */}
        {/* <div className="text-center mb-8">...</div> */}

        {/* Changed grid to 2 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto">
          {/* Left Column: Your Images */}
          <div className="lg:col-span-1">
            <GlassCard className="w-full">
              {/* Updated Header */}
              <GlassCardHeader className="flex flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Your Gallery</GlassCardTitle> {/* Changed title */}
                  <GlassCardDescription>All your generated images and videos</GlassCardDescription> {/* Changed description */}
                </div>
                <div className="flex gap-2">
                  <Link href="/debug">
                    <Button variant="outline" size="sm" className="text-white hover:bg-white/10">
                      Debug
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceReloadItems} // Updated function call
                    disabled={forceReloading}
                    className="text-white hover:bg-white/10"
                  >
                    {forceReloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reloading...
                      </>
                    ) : (
                      <>
                        <RotateCw className="h-4 w-4 mr-2" />
                        Force Reload
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={refreshHistory} className="text-white hover:bg-white/10">
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
              </GlassCardHeader>

              {/* Updated Content - Check galleryItems */}
              {galleryItems.length === 0 ? (
                <GlassCardContent>
                  <div className="flex flex-col items-center justify-center py-10 text-center"> {/* Adjusted padding */}
                    <Clock className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-300">No items generated yet</p> {/* Updated text */}
                  </div>
                </GlassCardContent>
              ) : (
                // Removed ScrollArea, adjusted padding and gap
                <GlassCardContent className="p-4">
                  {/* Updated grid, map over galleryItems */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryItems.map((item) => (
                      <div key={`gallery-item-${item.id}`} className="relative group aspect-square bg-black/20 rounded-md overflow-hidden"> {/* Added background */}
                        {item.type === 'image' ? (
                          <Image
                            src={item.output && item.output.length > 0 ? item.output[0] : ""}
                            alt={`Generated image ${item.id}`}
                            fill
                            style={{ objectFit: 'cover' }}
                            className={`cursor-pointer transition-all duration-300 ease-in-out ${selectedItem?.id === item.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-105'}`}
                            fallbackSrc="/placeholder/image.svg"
                            useProxy={true}
                            onClick={() => setSelectedItem(item)}
                          />
                        ) : ( // Render video thumbnail or placeholder
                          <div
                            className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out ${selectedItem?.id === item.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:opacity-80'}`}
                            onClick={() => setSelectedItem(item)}
                          >
                            {/* Basic video placeholder */}
                            <VideoIcon className="w-1/2 h-1/2 text-gray-400" />
                            {/* Ideally, you'd show a thumbnail here if available */}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCardContent>
              )}
              {/* Removed Footer with Clear History button */}
              {/* <GlassCardFooter>...</GlassCardFooter> */}
            </GlassCard>
          </div>

          {/* Right Column: Image Preview */}
          <div className="lg:col-span-1">
            {/* Make preview sticky */}
            <GlassCard className="w-full sticky top-24">
              {/* Updated Header */}
              <GlassCardHeader className="flex flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Preview</GlassCardTitle> {/* Changed title */}
                  <GlassCardDescription>Selected item details</GlassCardDescription> {/* Changed description */}
                </div>
                {selectedItem && (
                  <Button variant="ghost" size="icon" onClick={() => {
                    refreshHistory();
                    // Force reload the current image
                    const currentId = selectedItem.id;
                    setSelectedItem(null);
                    setTimeout(() => {
                      // Find the item in the potentially updated history
                      const refreshedItem = galleryItems.find(item => item.id === currentId);
                      if (refreshedItem) setSelectedItem(refreshedItem);
                      else setSelectedItem(null); // Deselect if item disappeared
                    }, 100);
                  }} className="text-white hover:bg-white/10">
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh Item</span> {/* Changed text */}
                  </Button>
                )}
              </GlassCardHeader>
              <GlassCardContent>
                {selectedItem ? (
                  <div className="space-y-4">
                    {/* Media Preview Area - Conditional Rendering */}
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black/20 flex items-center justify-center">
                      {selectedItem.type === 'image' && selectedItem.output && selectedItem.output.length > 0 ? (
                        <Image
                          src={selectedItem.output[0] || ""}
                          alt="Selected image preview"
                          fill
                          style={{ objectFit: 'contain' }}
                          className="max-h-full max-w-full"
                          fallbackSrc="/placeholder/image.svg"
                          useProxy={true}
                        />
                      ) : selectedItem.type === 'video' && selectedItem.output && selectedItem.output.length > 0 ? (
                        <video
                          key={selectedItem.output[0]} // Add key for React updates
                          src={selectedItem.output[0]}
                          controls
                          playsInline
                          muted
                          className="w-full h-full object-contain"
                          onError={(e) => console.error("Preview Video Error:", (e.target as HTMLVideoElement).error)}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-400">No preview available</p>
                        </div>
                      )}
                    </div>
                    {/* Details Section */}
                    <div className="space-y-2 text-sm pt-2"> {/* Increased spacing slightly */}
                      <h3 className="font-medium text-white">Prompt</h3>
                      <p className="text-gray-300 bg-black/10 p-3 rounded text-xs break-words">
                        {selectedItem.input.prompt}
                      </p>
                      {/* Added Model Display */}
                      {(selectedItem.model || selectedItem.input.model) && (
                         <>
                           <h3 className="font-medium text-white pt-1">Model</h3>
                           <p className="text-gray-300 text-xs">{selectedItem.model || selectedItem.input.model}</p>
                         </>
                      )}
                    </div>
                  </div>
                ) : (
                  // Adjusted placeholder height and text
                  <div className="flex items-center justify-center py-12 h-[50vh]">
                    <p className="text-gray-300">Select an item from the gallery to view details</p> {/* Changed text */}
                  </div>
                )}
              </GlassCardContent>
              {/* Add Footer with Download/Share/Delete buttons */}
              {selectedItem && selectedItem.output && selectedItem.output.length > 0 && (
                <GlassCardFooter className="flex justify-end space-x-2 pt-4">
                  {/* Download Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                    onClick={() => {
                      const url = selectedItem.output?.[0];
                      if (!url) return;
                      const fileExtension = selectedItem.type === 'video' ? 'mp4' : 'webp'; // Basic extension logic
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `mrkniai-${selectedItem.type}-${selectedItem.id}.${fileExtension}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  {/* Share Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                    onClick={() => {
                      const url = selectedItem.output?.[0];
                      if (!url) return;
                      if (navigator.share) {
                        navigator.share({ title: `MrkniAI Generated ${selectedItem.type}`, url }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(url);
                        toast({ title: "URL Copied!", description: "Output URL copied to clipboard." });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                   {/* Delete Button */}
                   <Button
                    variant="destructive"
                    size="icon"
                    className="border-red-500/30 bg-red-900/30 text-red-200 hover:bg-red-900/50"
                    onClick={async () => {
                      if (!selectedItem || !selectedItem.type) return;
                      const idToDelete = selectedItem.id;
                      const typeToDelete = selectedItem.type;
                      // Optimistically remove from UI
                      setSelectedItem(null);
                      setGalleryItems(prev => prev.filter(item => item.id !== idToDelete));
                      try {
                        await removeFromHistory(idToDelete, typeToDelete);
                        toast({ title: "Deleted", description: `${typeToDelete} item removed from history.` });
                      } catch (error) {
                        console.error("Error deleting item:", error);
                        toast({ title: "Error", description: `Failed to delete ${typeToDelete}.`, variant: "destructive" });
                        // Re-fetch history to potentially restore item if delete failed
                        refreshHistory();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </GlassCardFooter>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
  )
}
