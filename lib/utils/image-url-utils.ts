/**
 * Utility functions for handling image URLs
 */

/**
 * Validates and fixes an image URL if needed
 * @param url The image URL to validate and fix
 * @returns The fixed URL or the original URL if no fix is needed
 */
export function validateAndFixImageUrl(url: string): string {
  if (!url) return url;
  
  // Trim the URL
  let fixedUrl = url.trim();
  
  // Check if it's a Supabase Storage URL
  const isSupabaseStorageUrl = fixedUrl.includes('supabase.co/storage/v1/object/public');
  
  // Add https:// prefix if needed
  if (isSupabaseStorageUrl && !fixedUrl.startsWith('http')) {
    console.log(`Adding https:// prefix to Supabase URL: ${fixedUrl}`);
    fixedUrl = `https://${fixedUrl}`;
  }
  
  // Add cache-busting parameter for Supabase Storage URLs
  if (isSupabaseStorageUrl && !fixedUrl.includes('?')) {
    const timestamp = Date.now();
    console.log(`Adding cache-busting parameter to URL: ${fixedUrl}`);
    fixedUrl = `${fixedUrl}?t=${timestamp}`;
  }
  
  return fixedUrl;
}

/**
 * Checks if an image URL is valid
 * @param url The image URL to check
 * @returns True if the URL is valid, false otherwise
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Basic URL validation
  return (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('/') || 
    url.startsWith('data:')
  );
}

/**
 * Checks if a URL is a Supabase Storage URL
 * @param url The URL to check
 * @returns True if the URL is a Supabase Storage URL, false otherwise
 */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('supabase.co/storage/v1/object/public');
}

/**
 * Adds a cache-busting parameter to a URL
 * @param url The URL to add the parameter to
 * @returns The URL with the cache-busting parameter
 */
export function addCacheBustingParameter(url: string): string {
  if (!url) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}
