// Define a more generic type for form data that matches what's used in the page component
export interface FormData {
  name: string;
  phone: string;
  delivery_location: string;
}


// API route for resetting shares
export const RESET_SHARES_API = "/api/reset-shares";

// API route for reservation cancellation - for sendBeacon API
export const CANCEL_RESERVATION_API = "/api/cancel-reservation";
