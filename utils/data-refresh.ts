import { SACRIFICE_UPDATED_EVENT } from "@/stores/global/useSacrificeStore";

/**
 * Utility functions for triggering data refresh events across the application
 * Used to ensure data consistency when updates are made to the database
 */

/**
 * Triggers a refresh of sacrifice data across the application
 * This broadcasts an event that any components listening for sacrifice updates will receive
 * 
 * @example
 * // After updating a sacrifice in the database:
 * triggerSacrificeRefresh();
 */
export function triggerSacrificeRefresh(): void {
  // Dispatch a custom event to notify other components to refresh data
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(SACRIFICE_UPDATED_EVENT);
    window.dispatchEvent(event);
  }
}

/**
 * Sets up a refresh listener that calls a specific function when data is refreshed
 * 
 * @param eventName The event to listen for
 * @param callback The function to call when the event is triggered
 * @returns A cleanup function to remove the event listener
 * 
 * @example
 * // In a React component:
 * useEffect(() => {
 *   const cleanup = setupRefreshListener(SACRIFICE_UPDATED_EVENT, () => {
 *     fetchSacrificeData();
 *   });
 *   
 *   return cleanup;
 * }, []);
 */
export function setupRefreshListener(
  eventName: string, 
  callback: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }
  
  // Add the event listener
  window.addEventListener(eventName, callback);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener(eventName, callback);
  };
} 