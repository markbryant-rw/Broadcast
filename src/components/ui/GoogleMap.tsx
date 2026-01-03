import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/google-maps';
import { MapPin } from 'lucide-react';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  children?: React.ReactNode;
  onLoad?: () => void;
  className?: string;
}

export default function GoogleMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '200px',
  children,
  onLoad,
  className,
}: GoogleMapProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div 
        className={`bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4 ${className}`}
        style={{ height }}
      >
        <MapPin className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">Map visualization</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add VITE_GOOGLE_MAPS_API_KEY to .env to enable maps
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="sale-map"
          gestureHandling="cooperative"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          onTilesLoaded={onLoad}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </Map>
      </APIProvider>
    </div>
  );
}
