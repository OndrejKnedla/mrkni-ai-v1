import { WelcomeGallery, GalleryItem } from "@/components/welcome-gallery";
import WelcomeClientContent from '@/components/welcome-client-content';
import { Video } from "lucide-react";
import { TikTokIcon } from "@/components/icons/tiktok-icon";

// Helper function to shuffle an array (Fisher-Yates algorithm) - Still useful
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// --- Define ALL available static items ---
const allStaticGalleryItems: GalleryItem[] = [
  // Images (Indices 0-29)
  { id: 'cs-img-1', type: 'image', url: '/coming-soon/i1.jpg' },
  { id: 'cs-img-2', type: 'image', url: '/coming-soon/i2.jpg' },
  { id: 'cs-img-3', type: 'image', url: '/coming-soon/i3.png' },
  { id: 'cs-img-4', type: 'image', url: '/coming-soon/i4.webp' },
  { id: 'cs-img-5', type: 'image', url: '/coming-soon/i5.jpg' },
  { id: 'cs-img-6', type: 'image', url: '/coming-soon/i6.jpg' },
  { id: 'cs-img-7', type: 'image', url: '/coming-soon/i7.jpg' },
  { id: 'cs-img-8', type: 'image', url: '/coming-soon/i8.jpeg' },
  { id: 'cs-img-9', type: 'image', url: '/coming-soon/i9.png' },
  { id: 'cs-img-10', type: 'image', url: '/coming-soon/i10.jpg' },
  { id: 'cs-img-11', type: 'image', url: '/coming-soon/i11.jpeg' },
  { id: 'cs-img-12', type: 'image', url: '/coming-soon/i12.jpg' },
  { id: 'cs-img-13', type: 'image', url: '/coming-soon/i13.png' },
  { id: 'cs-img-14', type: 'image', url: '/coming-soon/i14.webp' },
  { id: 'cs-img-15', type: 'image', url: '/coming-soon/i15.jpg' },
  { id: 'cs-img-16', type: 'image', url: '/coming-soon/i16.jpg' },
  { id: 'cs-img-17', type: 'image', url: '/coming-soon/i17.jpg' },
  { id: 'cs-img-18', type: 'image', url: '/coming-soon/i18.jpg' },
  { id: 'cs-img-19', type: 'image', url: '/coming-soon/i19.jpg' },
  { id: 'cs-img-20', type: 'image', url: '/coming-soon/i20.jpg' },
  { id: 'cs-img-21', type: 'image', url: '/coming-soon/i21.jpeg' },
  { id: 'cs-img-22', type: 'image', url: '/coming-soon/i22.png' },
  { id: 'cs-img-23', type: 'image', url: '/coming-soon/i23.webp' },
  { id: 'cs-img-24', type: 'image', url: '/coming-soon/i24.jpg' },
  { id: 'cs-img-25', type: 'image', url: '/coming-soon/i25.jpg' },
  { id: 'cs-img-26', type: 'image', url: '/coming-soon/i26.jpg' },
  { id: 'cs-img-27', type: 'image', url: '/coming-soon/i27.jpg' },
  { id: 'cs-img-28', type: 'image', url: '/coming-soon/i28.jpg' },
  { id: 'cs-img-29', type: 'image', url: '/coming-soon/i29.jpeg' },
  { id: 'cs-img-30', type: 'image', url: '/coming-soon/i30.png' },
  // Videos (Indices 30-59) - Adding posterUrl assuming corresponding .jpg exists
  { id: 'cs-vid-1', type: 'video', url: '/coming-soon/V1.mp4', posterUrl: '/coming-soon/V1.jpg' }, // Index 30
  { id: 'cs-vid-2', type: 'video', url: '/coming-soon/V2.mp4', posterUrl: '/coming-soon/V2.jpg' }, // Index 31
  { id: 'cs-vid-3', type: 'video', url: '/coming-soon/V3.mp4', posterUrl: '/coming-soon/V3.jpg' },
  { id: 'cs-vid-4', type: 'video', url: '/coming-soon/V4.mp4', posterUrl: '/coming-soon/V4.jpg' },
  { id: 'cs-vid-5', type: 'video', url: '/coming-soon/V5.mp4', posterUrl: '/coming-soon/V5.jpg' },
  { id: 'cs-vid-6', type: 'video', url: '/coming-soon/V6.mp4', posterUrl: '/coming-soon/V6.jpg' },
  { id: 'cs-vid-7', type: 'video', url: '/coming-soon/V7.mp4', posterUrl: '/coming-soon/V7.jpg' },
  { id: 'cs-vid-8', type: 'video', url: '/coming-soon/V8.mp4', posterUrl: '/coming-soon/V8.jpg' },
  { id: 'cs-vid-9', type: 'video', url: '/coming-soon/V9.mp4', posterUrl: '/coming-soon/V9.jpg' },
  { id: 'cs-vid-10', type: 'video', url: '/coming-soon/V10.mp4', posterUrl: '/coming-soon/V10.jpg' },
  { id: 'cs-vid-11', type: 'video', url: '/coming-soon/v11.mp4', posterUrl: '/coming-soon/v11.jpg' },
  { id: 'cs-vid-12', type: 'video', url: '/coming-soon/v12.mp4', posterUrl: '/coming-soon/v12.jpg' },
  { id: 'cs-vid-13', type: 'video', url: '/coming-soon/v13.mp4', posterUrl: '/coming-soon/v13.jpg' },
  { id: 'cs-vid-14', type: 'video', url: '/coming-soon/v14.mp4', posterUrl: '/coming-soon/v14.jpg' },
  { id: 'cs-vid-15', type: 'video', url: '/coming-soon/v15.mp4', posterUrl: '/coming-soon/v15.jpg' },
  { id: 'cs-vid-16', type: 'video', url: '/coming-soon/v16.mp4', posterUrl: '/coming-soon/v16.jpg' },
  { id: 'cs-vid-17', type: 'video', url: '/coming-soon/v17.mp4', posterUrl: '/coming-soon/v17.jpg' },
  { id: 'cs-vid-18', type: 'video', url: '/coming-soon/v18.mp4', posterUrl: '/coming-soon/v18.jpg' },
  { id: 'cs-vid-19', type: 'video', url: '/coming-soon/v19.mp4', posterUrl: '/coming-soon/v19.jpg' },
  { id: 'cs-vid-20', type: 'video', url: '/coming-soon/v20.mp4', posterUrl: '/coming-soon/v20.jpg' },
  { id: 'cs-vid-21', type: 'video', url: '/coming-soon/v21.mp4', posterUrl: '/coming-soon/v21.jpg' },
  { id: 'cs-vid-22', type: 'video', url: '/coming-soon/v22.mp4', posterUrl: '/coming-soon/v22.jpg' },
  { id: 'cs-vid-23', type: 'video', url: '/coming-soon/v23.mp4', posterUrl: '/coming-soon/v23.jpg' },
  { id: 'cs-vid-24', type: 'video', url: '/coming-soon/v24.mp4', posterUrl: '/coming-soon/v24.jpg' },
  { id: 'cs-vid-25', type: 'video', url: '/coming-soon/v25.mp4', posterUrl: '/coming-soon/v25.jpg' },
  { id: 'cs-vid-26', type: 'video', url: '/coming-soon/v26.mp4', posterUrl: '/coming-soon/v26.jpg' },
  { id: 'cs-vid-27', type: 'video', url: '/coming-soon/v27.mp4', posterUrl: '/coming-soon/v27.jpg' },
  { id: 'cs-vid-28', type: 'video', url: '/coming-soon/v28.mp4', posterUrl: '/coming-soon/v28.jpg' },
  { id: 'cs-vid-29', type: 'video', url: '/coming-soon/v29.mp4', posterUrl: '/coming-soon/v29.jpg' },
  { id: 'cs-vid-30', type: 'video', url: '/coming-soon/v30.mp4', posterUrl: '/coming-soon/v30.jpg' }, // Index 59
];

// --- Select and configure items for the mosaic layout (based on 4-column grid) ---
const mosaicGalleryItems: GalleryItem[] = [
  { ...allStaticGalleryItems[0], className: 'col-span-2 row-span-2' }, // Item 1: Top Left block
  { ...allStaticGalleryItems[1], className: 'col-span-1 row-span-1' }, // Item 2: Top Right (col 3)
  { ...allStaticGalleryItems[30], className: 'col-span-1 row-span-1' }, // Item 3: Top Right (col 4, video)
  { ...allStaticGalleryItems[3], className: 'col-span-1 row-span-1' }, // Item 4: Mid Right (col 3, row 2)
  { ...allStaticGalleryItems[31], className: 'col-span-1 row-span-1' }, // Item 5: Mid Right (col 4, row 2, video)
  { ...allStaticGalleryItems[4], className: 'col-span-4 row-span-1' }, // Item 6: Bottom wide
];

// --- IDs of items to exclude (broken videos + specific removals) ---
// Adding v19 back to exclusions. Keeping v11, v12, v13, v24 excluded. i19, i20 remain included.
const excludedItemIds = new Set([
  // Broken Videos (as identified before)
  'cs-vid-1', 'cs-vid-2', 'cs-vid-3', 'cs-vid-4', 'cs-vid-6',
  'cs-vid-7', 'cs-vid-8', 'cs-vid-9', 'cs-vid-10',
  // Specific Removals
  'cs-vid-11', 'cs-vid-12', 'cs-vid-13', 'cs-vid-24', 'cs-vid-19',
  'cs-img-19' // Added i19 for removal
  // Note: cs-img-20 is included
]);


export default async function WelcomePage() {
  // Filter out the excluded items
  const finalGalleryItems = allStaticGalleryItems.filter(item => !excludedItemIds.has(item.id));

  // Shuffle the remaining items to mix images and videos
  const allWorkingShuffledItems = shuffleArray([...finalGalleryItems]); // Shuffle the full working list

  return (
    <div className="flex flex-col items-center pt-12 pb-12 px-4 relative">
       {/* All the client-side content (logo, title, countdown, form, features, testimonials)
           will be rendered by WelcomeClientContent */}
      <WelcomeClientContent />

      {/* Updated Title for the gallery - Reduced top margin and changed color */}
      <h2 className="text-3xl font-bold text-green-400 mb-6 text-center mt-6"> {/* Changed mt-12 to mt-6 and text-white to text-green-400 */}
        Explore What MrkniAI Creates
      </h2>

      {/* Showcase Gallery Section - Pass the full shuffled list */}
      {/* The component itself will handle showing initial items + load more */}
      <WelcomeGallery galleryItems={allWorkingShuffledItems} />

      {/* Follow Us Title */}
      <h3 className="text-xl font-semibold text-white mt-12 mb-4 text-center"> {/* Added title */}
        Follow Us
      </h3>

      {/* Social Media Links */}
      <div className="flex justify-center space-x-6 mb-8"> {/* Removed top margin, handled by title */}
        <a
          href="https://www.youtube.com/@MrkniAI"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full p-3 hover:bg-white/10 transition-colors"
          aria-label="MrkniAI on YouTube"
        >
          <Video className="h-6 w-6 text-white" />
        </a>
        <a
          href="https://www.tiktok.com/@mrkniai"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full p-3 hover:bg-white/10 transition-colors"
          aria-label="MrkniAI on TikTok"
        >
          <TikTokIcon className="h-6 w-6 text-white" />
        </a>
      </div>
    </div>
  );
}
