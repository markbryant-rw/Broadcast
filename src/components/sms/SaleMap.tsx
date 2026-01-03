import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertCircle } from 'lucide-react';
import { NearbySale } from '@/hooks/useNearbySales';
import { Opportunity } from '@/hooks/useOpportunities';

interface SaleMapProps {
  sale: NearbySale;
  opportunities: Opportunity[];
  mapboxToken?: string;
}

// Default center for New Zealand if geocoding fails
const NZ_DEFAULT_CENTER: [number, number] = [174.7633, -36.8485];

export default function SaleMap({ sale, opportunities, mapboxToken }: SaleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check for token
    if (!mapboxToken) {
      setError('Mapbox API key not configured');
      setIsLoading(false);
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: NZ_DEFAULT_CENTER,
        zoom: 14,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: false }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsLoading(false);

        // Add sale marker (main property)
        const saleMarkerEl = document.createElement('div');
        saleMarkerEl.className = 'sale-marker';
        saleMarkerEl.innerHTML = `
          <div style="
            background: linear-gradient(135deg, hsl(252 85% 60%) 0%, hsl(280 80% 55%) 100%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        `;

        new mapboxgl.Marker({ element: saleMarkerEl })
          .setLngLat(NZ_DEFAULT_CENTER) // Would use geocoded coords
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>${sale.address}</strong>
                <br/>
                <span style="color: hsl(252 85% 60%); font-weight: bold;">
                  ${formatPrice(sale.sale_price)}
                </span>
              </div>
            `)
          )
          .addTo(map.current!);

        // Add opportunity markers
        opportunities.forEach((opp, index) => {
          const isHot = opp.neverContacted && opp.sameStreet;
          const offset: [number, number] = [
            0.001 * (Math.random() - 0.5),
            0.001 * (Math.random() - 0.5),
          ];

          const markerEl = document.createElement('div');
          markerEl.innerHTML = `
            <div style="
              background: ${isHot ? 'hsl(142 71% 45%)' : opp.neverContacted ? 'hsl(38 92% 50%)' : 'hsl(220 14% 50%)'};
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              border: 2px solid white;
              cursor: pointer;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          `;

          const coords: [number, number] = [
            NZ_DEFAULT_CENTER[0] + offset[0],
            NZ_DEFAULT_CENTER[1] + offset[1],
          ];

          new mapboxgl.Marker({ element: markerEl })
            .setLngLat(coords)
            .setPopup(
              new mapboxgl.Popup({ offset: 15 }).setHTML(`
                <div style="padding: 8px;">
                  <strong>${opp.contact.first_name || 'Unknown'} ${opp.contact.last_name || ''}</strong>
                  <br/>
                  <span style="font-size: 12px; color: #666;">
                    ${opp.contact.address || 'No address'}
                  </span>
                  ${opp.neverContacted ? '<br/><span style="color: hsl(38 92% 50%); font-size: 11px; font-weight: 500;">Never contacted</span>' : ''}
                </div>
              `)
            )
            .addTo(map.current!);
        });
      });

      map.current.on('error', e => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      map.current?.remove();
    };
  }, [sale, opportunities, mapboxToken]);

  if (error || !mapboxToken) {
    return (
      <div className="h-48 bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
        <MapPin className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">Map visualization</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your Mapbox API key in secrets to enable maps
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-48 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Loading map...</div>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs flex items-center gap-3 z-10">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full gradient-primary"></div>
          <span>Sale</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <span>Hot</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <span>New</span>
        </div>
      </div>
    </div>
  );
}

function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}
