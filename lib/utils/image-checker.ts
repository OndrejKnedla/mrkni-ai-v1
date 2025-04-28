/**
 * Utility for checking and fixing image URLs
 */
import { validateAndFixImageUrl } from './image-url-utils';

/**
 * Checks if an image URL is accessible
 * @param url The image URL to check
 * @returns A promise that resolves to true if the image is accessible, false otherwise
 */
export async function checkImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking image URL ${url}:`, error);
    return false;
  }
}

/**
 * Checks and fixes image URLs in history items
 * @param historyItems The history items to check
 * @returns The history items with fixed URLs
 */
export function checkAndFixHistoryItems(historyItems: any[]): any[] {
  if (!historyItems || !Array.isArray(historyItems)) return historyItems;
  
  return historyItems.map(item => {
    if (!item || !item.output || !Array.isArray(item.output)) return item;
    
    // Fix URLs in the output array
    const fixedOutput = item.output.map((url: string) => {
      if (!url) return url;
      return validateAndFixImageUrl(url);
    });
    
    return {
      ...item,
      output: fixedOutput
    };
  });
}

/**
 * Periodically checks and fixes image URLs in localStorage
 */
export function startImageUrlChecker(): void {
  // Check every 5 minutes
  const INTERVAL = 5 * 60 * 1000;
  
  const checkLocalStorage = () => {
    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      
      // Find history-related keys
      const historyKeys = keys.filter(key => key.startsWith('mrkniai-history'));
      
      // Process each history key
      historyKeys.forEach(key => {
        try {
          const historyData = localStorage.getItem(key);
          if (!historyData) return;
          
          const historyItems = JSON.parse(historyData);
          if (!Array.isArray(historyItems)) return;
          
          // Fix URLs in history items
          const fixedItems = checkAndFixHistoryItems(historyItems);
          
          // Save fixed items back to localStorage
          localStorage.setItem(key, JSON.stringify(fixedItems));
          
          console.log(`Fixed URLs in localStorage key: ${key}`);
        } catch (error) {
          console.error(`Error processing localStorage key ${key}:`, error);
        }
      });
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  };
  
  // Run immediately
  checkLocalStorage();
  
  // Set up interval
  setInterval(checkLocalStorage, INTERVAL);
}
