import { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY, DEFAULT_CENTER } from '@/lib/google-maps';
import { MapPin, Home, User, Flame, MessageSquare, X as XIcon } from 'lucide-react';
import { NearbySale } from '@/hooks/useNearbySales';
import { Opportunity } from '@/hooks/useOpportunities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SaleMapProps {
  sale: NearbySale;
  opportunities: Opportunity[];
  onSendSMS?: (opportunity: Opportunity) => void;
}

// Generate offset positions for opportunities without coordinates
function generateOffsetPosition(
  baseLat: number,
  baseLng: number,
  index: number,
  total: number
): { lat: number; lng: number } {
  const radius = 0.002; // ~200m spread
  const angle = (2 * Math.PI * index) / Math.max(total, 1);
  const jitter = (Math.random() - 0.5) * 0.0005;
  
  return {
    lat: baseLat + radius * Math.sin(angle) + jitter,
    lng: baseLng + radius * Math.cos(angle) + jitter,
  };
}

function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function SaleMap({ sale, opportunities, onSendSMS }: SaleMapProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showSaleInfo, setShowSaleInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine sale center - use geocoded coords or default
  const saleCenter = useMemo(() => {
    if (sale.latitude && sale.longitude) {
      return { lat: Number(sale.latitude), lng: Number(sale.longitude) };
    }
    return DEFAULT_CENTER;
  }, [sale.latitude, sale.longitude]);

  // Calculate opportunity positions
  const opportunityPositions = useMemo(() => {
    return opportunities.map((opp, index) => {
      const contact = opp.contact;
      if (contact.latitude && contact.longitude) {
        return {
          opp,
          position: { lat: Number(contact.latitude), lng: Number(contact.longitude) },
        };
      }
      // Generate offset from sale
      return {
        opp,
        position: generateOffsetPosition(saleCenter.lat, saleCenter.lng, index, opportunities.length),
      };
    });
  }, [opportunities, saleCenter]);

  // Get marker color based on status
  const getMarkerStyle = useCallback((opp: Opportunity) => {
    if (opp.actionStatus === 'ignored') {
      return { bg: 'hsl(var(--muted))', border: 'hsl(var(--muted-foreground))', opacity: 0.5 };
    }
    if (opp.actionStatus === 'contacted') {
      return { bg: 'hsl(var(--primary))', border: 'hsl(var(--primary))', opacity: 0.7 };
    }
    if (opp.neverContacted && opp.sameStreet) {
      return { bg: 'hsl(142 71% 45%)', border: 'hsl(142 71% 35%)', opacity: 1 }; // Hot - Green
    }
    if (opp.neverContacted) {
      return { bg: 'hsl(38 92% 50%)', border: 'hsl(38 92% 40%)', opacity: 1 }; // New - Orange
    }
    return { bg: 'hsl(220 14% 50%)', border: 'hsl(220 14% 40%)', opacity: 0.8 }; // Contacted
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-56 bg-muted rounded-xl flex flex-col items-center justify-center text-center p-4">
        <MapPin className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">Map visualization</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable interactive maps
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-56 rounded-xl overflow-hidden border border-border/50">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={saleCenter}
          defaultZoom={16}
          mapId="sale-detail-map"
          gestureHandling="cooperative"
          disableDefaultUI={true}
          zoomControl={true}
          onTilesLoaded={() => setIsLoaded(true)}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Sale Property Marker */}
          <AdvancedMarker
            position={saleCenter}
            onClick={() => setShowSaleInfo(true)}
            zIndex={100}
          >
            <div 
              className="relative cursor-pointer transition-transform hover:scale-110"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(280 80% 55%) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                border: '3px solid white',
              }}
            >
              <Home className="h-5 w-5 text-white" />
            </div>
          </AdvancedMarker>

          {/* Opportunity Markers */}
          {opportunityPositions.map(({ opp, position }) => {
            const style = getMarkerStyle(opp);
            const isHot = opp.neverContacted && opp.sameStreet;
            
            return (
              <AdvancedMarker
                key={opp.contact.id}
                position={position}
                onClick={() => setSelectedOpportunity(opp)}
                zIndex={isHot ? 50 : 10}
              >
                <div 
                  className="relative cursor-pointer transition-transform hover:scale-110"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: style.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: `2px solid white`,
                    opacity: style.opacity,
                  }}
                >
                  {isHot ? (
                    <Flame className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                {isHot && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
                )}
              </AdvancedMarker>
            );
          })}

          {/* Sale Info Window */}
          {showSaleInfo && (
            <InfoWindow
              position={saleCenter}
              onCloseClick={() => setShowSaleInfo(false)}
              pixelOffset={[0, -22]}
            >
              <div className="p-1 min-w-[180px]">
                <div className="font-semibold text-sm text-foreground">{sale.address.replace(/"/g, '')}</div>
                <div className="text-primary font-bold mt-1">{formatPrice(sale.sale_price)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {sale.bedrooms && `${sale.bedrooms} bed`}
                  {sale.property_type && ` · ${sale.property_type}`}
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Opportunity Info Window */}
          {selectedOpportunity && (
            <InfoWindow
              position={opportunityPositions.find(p => p.opp.contact.id === selectedOpportunity.contact.id)?.position || saleCenter}
              onCloseClick={() => setSelectedOpportunity(null)}
              pixelOffset={[0, -16]}
            >
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm text-foreground">
                    {selectedOpportunity.contact.first_name || 'Unknown'} {selectedOpportunity.contact.last_name || ''}
                  </div>
                  {selectedOpportunity.neverContacted && selectedOpportunity.sameStreet && (
                    <Badge className="bg-success text-success-foreground text-xs px-1.5 py-0">Hot</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {selectedOpportunity.contact.address || 'No address'}
                </div>
                {selectedOpportunity.neverContacted && (
                  <div className="text-xs text-warning mt-0.5 font-medium">Never contacted</div>
                )}
                {onSendSMS && selectedOpportunity.actionStatus !== 'ignored' && (
                  <Button
                    size="sm"
                    className="w-full mt-2 gap-1.5 h-7 text-xs"
                    onClick={() => {
                      onSendSMS(selectedOpportunity);
                      setSelectedOpportunity(null);
                    }}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Send SMS
                  </Button>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading map...</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-3 shadow-sm border border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-[hsl(280,80%,55%)]" />
          <span className="text-muted-foreground">Sale</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Hot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">New</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span className="text-muted-foreground">Other</span>
        </div>
      </div>
    </div>
  );
}
