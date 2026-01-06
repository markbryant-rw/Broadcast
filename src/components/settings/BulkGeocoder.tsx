import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, CheckCircle2, AlertCircle, Play, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TABLES } from '@/lib/constants/tables';

interface GeocodingStats {
  sales: { total: number; missing: number };
  contacts: { total: number; missing: number };
}
  const { user } = useAuth();

export function BulkGeocoder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, table: '' });
  const [results, setResults] = useState({ success: 0, failed: 0 });

  // Fetch stats for records missing geocoding
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery<GeocodingStats>({
    queryKey: ['geocoding-stats'],
    queryFn: async () => {
      const [salesTotal, salesMissing, contactsTotal, contactsMissing] = await Promise.all([
        supabase.from('nearby_sales').select('id', { count: 'exact', head: true }),
        supabase.from('nearby_sales').select('id', { count: 'exact', head: true }).is('latitude', null),
        supabase.from(TABLES.CONTACTS).select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from(TABLES.CONTACTS).select('id', { count: 'exact', head: true }).eq('user_id', user?.id).is('latitude', null),
      ]);

      return {
        sales: { 
          total: salesTotal.count || 0, 
          missing: salesMissing.count || 0 
        },
        contacts: { 
          total: contactsTotal.count || 0, 
          missing: contactsMissing.count || 0 
        },
      };
    },
  });

  const geocodeMutation = useMutation({
    mutationFn: async () => {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not configured');
      }

      setResults({ success: 0, failed: 0 });
      let successCount = 0;
      let failedCount = 0;

      // Fetch sales missing coordinates
      const { data: salesData } = await supabase
        .from('nearby_sales')
        .select('id, address, suburb, city')
        .is('latitude', null)
        .limit(100);

      // Fetch contacts missing coordinates
      const { data: contactsData } = await supabase
        .from(TABLES.CONTACTS)
        .select('id, address, address_suburb, address_city')
        .eq('user_id', user?.id)
        .is('latitude', null)
        .not('address', 'is', null)
        .limit(100);

      const sales = salesData || [];
      const contacts = contactsData || [];
      const total = sales.length + contacts.length;
      setProgress({ current: 0, total, table: '' });

      // Process sales
      for (let i = 0; i < sales.length; i++) {
        const sale = sales[i];
        setProgress({ current: i + 1, total, table: 'Sales' });

        const fullAddress = `${sale.address}, ${sale.suburb}, ${sale.city}, New Zealand`;
        
        try {
          // Rate limit: wait 100ms between requests
          await new Promise((resolve) => setTimeout(resolve, 100));

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              fullAddress
            )}&region=nz&key=${GOOGLE_MAPS_API_KEY}`
          );

          const data = await response.json();

          if (data.status === 'OK' && data.results[0]) {
            const location = data.results[0].geometry.location;
            
            await supabase
              .from('nearby_sales')
              .update({
                latitude: location.lat,
                longitude: location.lng,
                geocoded_at: new Date().toISOString(),
              })
              .eq('id', sale.id);

            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`Failed to geocode sale ${sale.id}:`, err);
          failedCount++;
        }

        setResults({ success: successCount, failed: failedCount });
      }

      // Process contacts
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        setProgress({ current: sales.length + i + 1, total, table: 'Contacts' });

        const fullAddress = [
          contact.address,
          contact.address_suburb,
          contact.address_city,
          'New Zealand'
        ].filter(Boolean).join(', ');
        
        if (!fullAddress || fullAddress === 'New Zealand') {
          failedCount++;
          setResults({ success: successCount, failed: failedCount });
          continue;
        }

        try {
          await new Promise((resolve) => setTimeout(resolve, 100));

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              fullAddress
            )}&region=nz&key=${GOOGLE_MAPS_API_KEY}`
          );

          const data = await response.json();

          if (data.status === 'OK' && data.results[0]) {
            const location = data.results[0].geometry.location;
            
            await supabase
              .from(TABLES.CONTACTS)
              .update({
                latitude: location.lat,
                longitude: location.lng,
                geocoded_at: new Date().toISOString(),
              })
              .eq('id', contact.id)
              .eq('user_id', user?.id);

            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`Failed to geocode contact ${contact.id}:`, err);
          failedCount++;
        }

        setResults({ success: successCount, failed: failedCount });
      }

      return { success: successCount, failed: failedCount };
    },
    onSuccess: (data) => {
      setIsRunning(false);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['nearby_sales'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      toast({
        title: 'Geocoding complete',
        description: `Successfully geocoded ${data.success} records. ${data.failed} failed.`,
      });
    },
    onError: (error) => {
      setIsRunning(false);
      toast({
        title: 'Geocoding failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const handleStart = () => {
    setIsRunning(true);
    geocodeMutation.mutate();
  };

  const totalMissing = (stats?.sales.missing || 0) + (stats?.contacts.missing || 0);
  const hasApiKey = !!GOOGLE_MAPS_API_KEY;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Bulk Geocoding
        </CardTitle>
        <CardDescription>
          Convert addresses to map coordinates for all your sales and contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Status */}
        {!hasApiKey && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Google Maps API key not configured. Add <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file.
            </span>
          </div>
        )}

        {/* Stats */}
        {loadingStats ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading stats...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold">{stats?.sales.total || 0}</div>
              <div className="text-sm text-muted-foreground">Sales Records</div>
              {(stats?.sales.missing || 0) > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {stats?.sales.missing} missing coordinates
                </Badge>
              )}
              {stats?.sales.missing === 0 && stats?.sales.total !== undefined && stats.sales.total > 0 && (
                <Badge className="mt-2 bg-success text-success-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  All geocoded
                </Badge>
              )}
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold">{stats?.contacts.total || 0}</div>
              <div className="text-sm text-muted-foreground">Contact Records</div>
              {(stats?.contacts.missing || 0) > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {stats?.contacts.missing} missing coordinates
                </Badge>
              )}
              {stats?.contacts.missing === 0 && stats?.contacts.total !== undefined && stats.contacts.total > 0 && (
                <Badge className="mt-2 bg-success text-success-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  All geocoded
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Processing {progress.table}... ({progress.current}/{progress.total})
              </span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex gap-4 text-sm">
              <span className="text-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {results.success} success
              </span>
              {results.failed > 0 && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {results.failed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={!hasApiKey || isRunning || totalMissing === 0}
            className="gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Processing...' : totalMissing > 0 ? `Geocode ${totalMissing} Records` : 'All Records Geocoded'}
          </Button>
          <Button
            variant="outline"
            onClick={() => refetchStats()}
            disabled={isRunning}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          Geocoding uses the Google Geocoding API. Processes up to 100 records per batch at ~10 requests/second to stay within rate limits.
        </p>
      </CardContent>
    </Card>
  );
}