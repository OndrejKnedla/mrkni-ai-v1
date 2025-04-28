"use client"; // Mark as a Client Component

import React, { useState, useEffect } from 'react'; // Import useState
import { Image } from "@/components/ui/image";
import { Video } from "@/components/ui/video";
import { Button } from "@/components/ui/button"; // Import Button component

// Define the expected structure for a gallery item
export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  className?: string; // Add optional className for custom styling
  posterUrl?: string; // Add optional poster URL for videos
}

// Define the props for the WelcomeGallery component
interface WelcomeGalleryProps {
  galleryItems: GalleryItem[]; // This prop now receives the FULL list
}

const ITEMS_PER_PAGE = 9; // Number of items to load each time

export function WelcomeGallery({ galleryItems: allItems }: WelcomeGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE); // State for visible items

  // Slice the full list to get the currently visible items
  const visibleItems = allItems.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
  };

  // Basic check for empty items (using the original full list)
  if (!allItems || allItems.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto mb-16 text-center text-gray-400">
        <p>No gallery items to display.</p>
      </div>
    );
  }

  return (
    // Keep container, but content inside will change
    <div className="w-full max-w-7xl mx-auto mb-16">
      {/* Grid for the visible items */}
      <div className="grid grid-cols-3 gap-0">
        {visibleItems.map((item) => { // Map over visibleItems
          // Item container takes full height of implicit row. Added hover effects.
          const itemClasses = `relative overflow-hidden group h-full transition-all duration-300 ease-in-out hover:scale-105 hover:brightness-110 hover:z-10 ${item.className || ''}`;
          // Restore the wrapping div structure (already correct)
          return (
            <div key={item.id} className={itemClasses.trim()}>
              {item.type === 'image' ? (
                <Image
                  // Ensure image fills the grid cell
                  src={item.url}
                  alt={`Showcase ${item.type} ${item.id}`}
                  width={500} // Indicative width/height
                  height={500}
                  style={{ objectFit: 'cover' }} // Cover ensures the item fills its area
                  className="w-full h-full block object-cover" // Ensure full height and width fill
                  fallbackSrc="/placeholder/image.svg"
                  useProxy={false}
                />
              ) : (
                // Use the custom Video component with autoplay, muted, and no controls
                <Video
                  // Ensure video fills the grid cell
                  src={item.url}
                  autoPlay={true} // Keep autoplay for videos
                  muted={true}
                  loop={true}
                  controls={false}
                  poster={item.posterUrl || "/placeholder/video-fallback.svg"} // Use item.posterUrl if available
                  className="w-full h-full block object-cover" // Ensure full height and width fill
                />
              )}
              {/* Removed overlay */}
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {visibleCount < allItems.length && ( // Show button only if there are more items
        <div className="mt-8 text-center">
          <Button
            onClick={loadMore}
            variant="outline"
            className="bg-black/30 border-white/20 hover:bg-white/10 text-white"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
