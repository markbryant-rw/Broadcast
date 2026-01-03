import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Filter, MapPin, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NearbySale {
  id: string;
  address: string;
  suburb: string;
  city: string;
  sale_price: number | null;
  sale_date: string | null;
  property_type: string | null;
  bedrooms: number | null;
  days_to_sell: number | null;
  street_name: string | null;
  street_number: string | null;
}

export default function SalesDataTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [suburbFilter, setSuburbFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch all sales
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['nearby-sales-all', suburbFilter, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('nearby_sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (suburbFilter && suburbFilter !== 'all') {
        query = query.eq('suburb', suburbFilter);
      }

      if (startDate) {
        query = query.gte('sale_date', startDate);
      }

      if (endDate) {
        query = query.lte('sale_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NearbySale[];
    },
    enabled: !!user,
  });

  // Fetch unique suburbs for filter
  const { data: suburbs = [] } = useQuery({
    queryKey: ['nearby-sales-suburbs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nearby_sales')
        .select('suburb')
        .order('suburb');

      if (error) throw error;
      
      // Get unique suburbs
      const uniqueSuburbs = [...new Set(data.map(s => s.suburb))];
      return uniqueSuburbs;
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nearby_sales')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nearby-sales'] });
      toast.success('Sale record deleted');
    },
    onError: () => {
      toast.error('Failed to delete sale record');
    },
  });

  // Clear suburb mutation
  const clearSuburb = useMutation({
    mutationFn: async (suburb: string) => {
      const { error } = await supabase
        .from('nearby_sales')
        .delete()
        .eq('suburb', suburb);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nearby-sales'] });
      setSuburbFilter('all');
      toast.success('All sales for suburb cleared');
    },
    onError: () => {
      toast.error('Failed to clear suburb data');
    },
  });

  const handleClearSuburb = () => {
    if (suburbFilter && suburbFilter !== 'all') {
      if (confirm(`Are you sure you want to delete all sales data for ${suburbFilter}?`)) {
        clearSuburb.mutate(suburbFilter);
      }
    }
  };

  const handleClearFilters = () => {
    setSuburbFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(parseISO(date), 'dd MMM yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Sales Data
          <Badge variant="secondary" className="ml-2">
            {sales.length} records
          </Badge>
        </CardTitle>
        <CardDescription>
          View and manage uploaded sales data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end p-4 rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label>Suburb</Label>
            <Select value={suburbFilter} onValueChange={setSuburbFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All suburbs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suburbs</SelectItem>
                {suburbs.map(suburb => (
                  <SelectItem key={suburb} value={suburb}>
                    {suburb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>From Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[160px]"
            />
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[160px]"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>

          {suburbFilter && suburbFilter !== 'all' && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearSuburb}
              disabled={clearSuburb.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear {suburbFilter}
            </Button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading sales data...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sales data found. Upload a REINZ CSV to get started.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Suburb</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead className="text-center">Beds</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.street_number} {sale.street_name}
                    </TableCell>
                    <TableCell>{sale.suburb}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(sale.sale_price)}
                    </TableCell>
                    <TableCell>{formatDate(sale.sale_date)}</TableCell>
                    <TableCell className="text-center">{sale.bedrooms || '-'}</TableCell>
                    <TableCell className="text-center">{sale.days_to_sell || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Delete this sale record?')) {
                            deleteSale.mutate(sale.id);
                          }
                        }}
                        disabled={deleteSale.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
