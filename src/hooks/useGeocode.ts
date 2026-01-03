import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';

interface GeocodingResult {
  lat: number;
  lng: number;
}

interface UseGeocodeOptions {
  address: string | null;
  existingLat?: number | null;
  existingLng?: number | null;
  table?: 'nearby_sales' | 'contacts';
  recordId?: string;
}

// Simple in-memory cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult>();

export function useGeocode({
  address,
  existingLat,
  existingLng,
  table,
  recordId,
}: UseGeocodeOptions) {
  const [result, setResult] = useState<GeocodingResult | null>(
    existingLat && existingLng ? { lat: existingLat, lng: existingLng } : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // If we already have coordinates, use them
    if (existingLat && existingLng) {
      setResult({ lat: existingLat, lng: existingLng });
      return;
    }

    if (!address || !GOOGLE_MAPS_API_KEY) {
      return;
    }

    // Check cache first
    const cached = geocodeCache.get(address);
    if (cached) {
      setResult(cached);
      return;
    }

    // Geocode the address
    const geocode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
          )}&region=nz&key=${GOOGLE_MAPS_API_KEY}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results[0]) {
          const location = data.results[0].geometry.location;
          const coords: GeocodingResult = {
            lat: location.lat,
            lng: location.lng,
          };

          // Cache the result
          geocodeCache.set(address, coords);
          setResult(coords);

          // Optionally save to database for persistence
          if (table && recordId) {
            await supabase
              .from(table)
              .update({
                latitude: coords.lat,
                longitude: coords.lng,
                geocoded_at: new Date().toISOString(),
              })
              .eq('id', recordId);

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: [table] });
          }
        } else {
          setError(`Geocoding failed: ${data.status}`);
        }
      } catch (err) {
        setError('Failed to geocode address');
        console.error('Geocoding error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    geocode();
  }, [address, existingLat, existingLng, table, recordId, queryClient]);

  return { result, isLoading, error };
}

// Batch geocode multiple addresses
export function useBatchGeocode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      items: Array<{ id: string; address: string; table: 'nearby_sales' | 'contacts' }>
    ) => {
      const results: Array<{ id: string; lat: number; lng: number }> = [];

      for (const item of items) {
        // Check cache first
        const cached = geocodeCache.get(item.address);
        if (cached) {
          results.push({ id: item.id, ...cached });
          continue;
        }

        // Rate limit: wait 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              item.address
            )}&region=nz&key=${GOOGLE_MAPS_API_KEY}`
          );

          const data = await response.json();

          if (data.status === 'OK' && data.results[0]) {
            const location = data.results[0].geometry.location;
            geocodeCache.set(item.address, { lat: location.lat, lng: location.lng });
            results.push({ id: item.id, lat: location.lat, lng: location.lng });

            // Update database
            await supabase
              .from(item.table)
              .update({
                latitude: location.lat,
                longitude: location.lng,
                geocoded_at: new Date().toISOString(),
              })
              .eq('id', item.id);
          }
        } catch (err) {
          console.error(`Failed to geocode ${item.address}:`, err);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nearby_sales'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
