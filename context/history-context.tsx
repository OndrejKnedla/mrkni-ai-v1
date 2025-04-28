"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { HistoryItem } from "@/lib/types"
// Remove convertToHistoryItem import, getGenerationHistory now returns HistoryItem[]
import { getGenerationHistory, saveGeneration, deleteGeneration } from "@/lib/supabase/db"
import { useAuth } from "./auth-context"
import { checkAndFixHistoryItems, startImageUrlChecker } from "@/lib/utils/image-checker"

type HistoryContextType = {
  history: HistoryItem[]
  loading: boolean
  // Revert signature back to image-only
  // Update signatures to include type
  addToHistory: (item: HistoryItem, type: 'image' | 'video') => Promise<void>
  clearHistory: () => Promise<void> // clearHistory might need internal logic change if DB requires type
  removeFromHistory: (id: string, type: 'image' | 'video') => Promise<void>
  refreshHistory: () => Promise<void>
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load history from localStorage
  const loadFromLocalStorage = (): HistoryItem[] => {
    try {
      const savedHistory = localStorage.getItem("mrkniai-history-" + (user?.id || 'anonymous'))
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[]
        console.log(`Loaded ${parsedHistory.length} history items from localStorage`)

        // Check and fix image URLs in history items
        const fixedHistory = checkAndFixHistoryItems(parsedHistory) as HistoryItem[]
        if (fixedHistory.length !== parsedHistory.length) {
          console.log(`Fixed history items count changed from ${parsedHistory.length} to ${fixedHistory.length}`)
        }

        return fixedHistory
      }
    } catch (error) {
      console.error("Error loading history from localStorage:", error)
    }
    return []
  }

  // Save history to localStorage
  const saveToLocalStorage = (items: HistoryItem[]) => {
    try {
      localStorage.setItem("mrkniai-history-" + (user?.id || 'anonymous'), JSON.stringify(items))
      console.log(`Saved ${items.length} history items to localStorage`)
    } catch (error) {
      console.error("Error saving history to localStorage:", error)
    }
  }

  const fetchHistory = async () => {
    if (!user) {
      setHistory([])
      setLoading(false)
      return
    }

    // First, load from localStorage to show something immediately
    const localItems = loadFromLocalStorage()
    if (localItems.length > 0) {
      console.log(`Using ${localItems.length} items from localStorage while fetching from database`)
      setHistory(localItems)
    }

    try {
      setLoading(true)
      // getGenerationHistory now returns combined HistoryItem[]
      const fetchedHistoryItems = await getGenerationHistory()

      // **** ADD LOGGING HERE ****
      console.log("[HistoryContext] Fetched items from getGenerationHistory:", JSON.stringify(fetchedHistoryItems, null, 2));
      // Check if the latest item has output URLs
      if (fetchedHistoryItems.length > 0) {
          console.log(`[HistoryContext] Latest fetched item (${fetchedHistoryItems[0]?.id}) output:`, fetchedHistoryItems[0]?.output);
      } else {
          console.log("[HistoryContext] Fetched 0 items.");
      }
      // **** END LOGGING ****

      console.log(`Fetched ${fetchedHistoryItems.length} history items from database (combined)`)

      // Deduplicate fetched items using a Map (optional but good practice)
      const uniqueItemsMap = new Map<string, HistoryItem>()
      fetchedHistoryItems.forEach(item => {
        if (item && item.id) { // Ensure item and id exist
          uniqueItemsMap.set(item.id, item);
        } else {
          console.warn("Fetched history item missing id:", item);
        }
      });

      // Convert map back to array and sort
      const uniqueHistoryItems = Array.from(uniqueItemsMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`Processed ${fetchedHistoryItems.length} items into ${uniqueHistoryItems.length} unique items`)

      // Set the unique history items to state
      setHistory(uniqueHistoryItems)

      // Save to localStorage as backup
      saveToLocalStorage(uniqueHistoryItems)
    } catch (error) {
      console.error("Error fetching history:", error)

      // If database fetch fails, use localStorage as fallback
      if (localItems.length > 0) {
        console.log(`Using ${localItems.length} items from localStorage as fallback`)
        setHistory(localItems)
      }
    } finally {
      setLoading(false)
    }
  }

  // Start the image URL checker when the component mounts
  useEffect(() => {
    // Start the periodic image URL checker
    startImageUrlChecker();
    console.log('Started periodic image URL checker');
  }, []);

  // Fetch history when user changes
  useEffect(() => {
    fetchHistory()
  }, [user])

  // Update addToHistory to accept and use type
  const addToHistory = async (item: HistoryItem, type: 'image' | 'video') => {
    console.log(`addToHistory called for ${type} item ID:`, item.id);

    try {
      if (user) {
        // Save to database, passing the type
        await saveGeneration(item, type);

        // Update local state using Map (existing logic should be fine)
        setHistory(prevHistory => {
          // Create a Map from the existing history items
          const historyMap = new Map<string, HistoryItem>();

          // Add all existing items to the map
          prevHistory.forEach(existingItem => {
            if (existingItem && existingItem.id) {
              historyMap.set(existingItem.id, existingItem);
            }
          });

          // Add or update the new item
          if (item && item.id) {
            if (historyMap.has(item.id)) {
              console.log(`Item ${item.id} already exists in history, updating`);
            }
            historyMap.set(item.id, item);
          }

          // Convert back to array and sort by created_at (newest first)
          const updatedHistory = Array.from(historyMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // Save to localStorage as backup for authenticated users
          saveToLocalStorage(updatedHistory);

          return updatedHistory;
        });

      } else {
        // Fallback to localStorage for non-authenticated users
        console.log("Adding item to localStorage history:", item.id);
        const savedHistory = localStorage.getItem("mrkniai-history-anonymous")
        const existingHistory = savedHistory ? JSON.parse(savedHistory) : []

        // Create a Map for deduplication
        const historyMap = new Map<string, HistoryItem>();

        // Add existing items to the map
        existingHistory.forEach((existingItem: HistoryItem) => {
          if (existingItem && existingItem.id) {
            historyMap.set(existingItem.id, existingItem);
          }
        });

        // Add the new item
        if (item && item.id) {
          historyMap.set(item.id, item);
        }

        // Convert back to array and sort
        const uniqueHistory = Array.from(historyMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        localStorage.setItem("mrkniai-history-anonymous", JSON.stringify(uniqueHistory))
        setHistory(uniqueHistory)
      }
    } catch (error) {
      console.error("Error adding to history:", error)
    }
  }

  const clearHistory = async () => {
    // This needs careful implementation - we need to know the type of each item to delete correctly
    console.warn("clearHistory called - iterating and deleting individually by type");
    try {
      if (user) {
        // Iterate and delete one by one, determining type
        for (const item of history) {
          if (item.type) { // Ensure type exists
             await deleteGeneration(item.id, item.type); // Call with type
          } else {
             console.warn(`History item ${item.id} missing type, attempting delete as image`);
             // Attempt delete as image if type is missing (legacy?)
             await deleteGeneration(item.id, 'image');
          }
        }
        setHistory([]);
        // Also clear localStorage backup
        localStorage.removeItem("mrkniai-history-" + user.id)
      } else {
        localStorage.removeItem("mrkniai-history-anonymous")
        setHistory([])
      }
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  }

  // Update removeFromHistory to accept and use type
  const removeFromHistory = async (id: string, type: 'image' | 'video') => {
    console.log(`removeFromHistory called for ${type} item ID:`, id);
    try {
      // Find the item to ensure it exists and potentially confirm type (optional)
      const itemToRemove = history.find(item => item.id === id && item.type === type);
      if (!itemToRemove) {
        console.warn(`Item ${id} of type ${type} not found in history, cannot remove`);
        // Optionally try finding by ID only if type mismatch is possible
        const itemByIdOnly = history.find(item => item.id === id);
        if (!itemByIdOnly) return; // Still not found
        console.warn(`Found item ${id} but with different type (${itemByIdOnly.type}), proceeding with removal using provided type ${type}`);
        // Fallthrough to attempt deletion with the provided type
      }

      if (user) {
        await deleteGeneration(id, type); // Call with type
        const updatedHistory = history.filter((item) => item.id !== id); // Simple filter by ID is sufficient for local state
        setHistory(updatedHistory);
        // Also update localStorage backup
        saveToLocalStorage(updatedHistory);
      } else {
        // LocalStorage removal for anonymous users
        const savedHistory = localStorage.getItem("mrkniai-history-anonymous")
        const existingHistory = savedHistory ? JSON.parse(savedHistory) : []
        const newHistory = existingHistory.filter((item: HistoryItem) => item.id !== id)
        localStorage.setItem("mrkniai-history-anonymous", JSON.stringify(newHistory))
        setHistory(history.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("Error removing from history:", error)
    }
  }

  const refreshHistory = async () => {
    await fetchHistory()
  }

  return (
    <HistoryContext.Provider
      value={{
        history,
        loading,
        addToHistory,
        clearHistory,
        removeFromHistory,
        refreshHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

export const useHistory = () => {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider")
  }
  return context
}
