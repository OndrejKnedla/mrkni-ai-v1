// Define a list of known working videos to use as fallbacks
// These are videos that we know exist and work properly

// GUARANTEED WORKING VIDEOS - these are the only ones we should use
// These have been tested and confirmed to work reliably
export const guaranteedWorkingVideos = [
  '/videos/videos-ai/haiper-video-2/1.mp4', // 1.1MB - confirmed working
  '/videos/videos-ai/ray-flash-2-540p/1.mp4', // smaller size, more reliable
];

// Coming soon MP4 videos - these are our secondary videos
// Only use these if the guaranteed ones fail
export const comingSoonVideos = [
  // Only include the most reliable coming-soon videos
  '/coming-soon/V1.mp4',
  '/coming-soon/V2.mp4',
];

// Combined fallback videos list - prioritize guaranteed working videos
export const fallbackVideos = [
  ...guaranteedWorkingVideos,
  ...comingSoonVideos
];

// Keep a list of all videos for reference
const allVideos = [
  ...guaranteedWorkingVideos,
  ...comingSoonVideos
];

/**
 * Get a fallback video URL if the primary one fails
 * @param originalUrl The original video URL that failed
 * @returns A fallback video URL
 */
export function getFallbackVideo(originalUrl: string): string {
  // Always prioritize our guaranteed working videos
  if (!guaranteedWorkingVideos.includes(originalUrl) && guaranteedWorkingVideos.length > 0) {
    // Return a guaranteed working video
    return guaranteedWorkingVideos[0]; // Always use the first one as it's most reliable
  }

  // If the original URL is already our primary guaranteed video, use the second one
  if (originalUrl === guaranteedWorkingVideos[0] && guaranteedWorkingVideos.length > 1) {
    return guaranteedWorkingVideos[1];
  }

  // If we're already using the second guaranteed video, use the first one
  if (originalUrl === guaranteedWorkingVideos[1] && guaranteedWorkingVideos.length > 0) {
    return guaranteedWorkingVideos[0];
  }

  // Last resort - use a coming soon video
  if (comingSoonVideos.length > 0) {
    return comingSoonVideos[0];
  }

  // Absolute last resort - return the original URL
  return originalUrl;
}
