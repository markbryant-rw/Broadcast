// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Auckland CBD - default center for New Zealand
export const DEFAULT_CENTER = { lat: -36.8485, lng: 174.7633 };
export const DEFAULT_ZOOM = 15;

export function getGoogleMapsConfig() {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }
  return { apiKey: GOOGLE_MAPS_API_KEY };
}

export function isGoogleMapsConfigured(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}
