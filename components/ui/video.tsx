"use client";

import React, { useState, useEffect, useRef } from 'react'; // Import hooks

// Keep the interface for props compatibility
interface VideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void; // Basic error prop
  onLoad?: () => void; // Basic load prop
  playOnHover?: boolean; // Prop exists but won't be used in this simplified version
}

// Extremely simplified Video component
export function Video({
  src,
  className = '',
  style = {},
  // Default props for basic functionality
  autoPlay = true, // Keep prop for intent, but control playback manually
  muted = true,
  loop = true,
  controls = true, // Enable controls by default for testing
  poster = '/placeholder/video-fallback.svg',
  onError, // Pass through onError if provided
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null); // Ref for the video element
  const [isVideoLoaded, setIsVideoLoaded] = useState(false); // State to track loading

  // Normalize the URL simply
  const normalizedSrc = (src && src.startsWith('/') ? src : `/${src || ''}`).replace(/\\/g, '/');

  // console.log(`Simplified Video component rendering with src: ${normalizedSrc}`); // Keep console log if needed for debugging

  // Handler for when video data is loaded enough to play
  const handleLoadedData = () => {
    setIsVideoLoaded(true);
    // console.log(`Video loaded: ${normalizedSrc}`); // Optional: log when loaded
  };

  // Effect to play the video once loaded, if autoPlay prop is true
  useEffect(() => {
    if (isVideoLoaded && autoPlay && videoRef.current) {
      videoRef.current.play().catch(error => {
        // Autoplay might be blocked by the browser, log error if needed
        console.error(`Autoplay failed for ${normalizedSrc}:`, error);
      });
    }
  }, [isVideoLoaded, autoPlay, normalizedSrc]); // Add dependencies

  // Basic error handler to log issues
  const handleNativeError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`Simplified Video component native error for ${normalizedSrc}:`, e);
    if (onError) {
      onError(e); // Call the passed onError prop if it exists
    }
  };

  // Render a plain HTML video tag with minimal logic
  // Ensure container and video take full height
  return (
    <div className="video-container relative w-full h-full overflow-hidden"> {/* Container takes full height */}
      <video
        ref={videoRef} // Assign ref
        className={`w-full h-full block ${className}`} // Video takes full height
        style={{ objectFit: 'cover', ...style }} // Keep objectFit: 'cover'
        src={normalizedSrc}
        autoPlay={false} // Set initial autoPlay to false
        muted={muted} // Keep muted for autoplay behavior
        loop={loop}
        controls={controls} // Keep controls prop
        playsInline // Good practice for mobile
        poster={poster} // Poster image is shown until loaded
        onLoadedData={handleLoadedData} // Set state when loaded
        onError={handleNativeError}
        key={normalizedSrc}
      >
        {/* Fallback text */}
        Your browser does not support the video tag or the video format.
      </video>
    </div>
  );
}

export default Video; // Ensure default export if needed elsewhere
