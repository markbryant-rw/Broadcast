import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parse, format } from 'date-fns';

interface ParsedSale {
  street_number: string;
  street_name: string;
  sale_price: number | null;
  sale_date: string | null;
  days_to_sell: number | null;
  valuation: number | null;
  bedrooms: number | null;
  floor_area: number | null;
  land_area: number | null;
}

const AUCKLAND_SUBURBS = [
  'Glen Eden', 'Henderson', 'Mt Eden', 'Ponsonby', 'Grey Lynn', 'Parnell',
  'Remuera', 'Epsom', 'Newmarket', 'Mt Albert', 'Sandringham', 'Kingsland',
  'Westmere', 'Herne Bay', 'St Heliers', 'Mission Bay', 'Kohimarama',
  'Orakei', 'Meadowbank', 'Ellerslie', 'One Tree Hill', 'Royal Oak',
  'Onehunga', 'Mt Wellington', 'Panmure', 'Glen Innes', 'Pt England',
  'Avondale', 'New Lynn', 'Titirangi', 'Green Bay', 'Blockhouse Bay',
  'Lynfield', 'Mt Roskill', 'Three Kings', 'Hillsborough', 'Mangere Bridge',
  'Howick', 'Pakuranga', 'Botany', 'Flat Bush', 'Dannemora', 'East Tamaki',
  'Manukau', 'Papatoetoe', 'Otahuhu', 'Mangere', 'Takanini', 'Papakura',
  'Albany', 'Browns Bay', 'Glenfield', 'Northcote', 'Birkenhead', 'Devonport',
  'Takapuna', 'Milford', 'Castor Bay', 'Murrays Bay', 'Mairangi Bay'
].sort();

const CITIES = ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin'];

export default function SalesUploader() {
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('Auckland');
  const [parsedData, setParsedData] = useState<ParsedSale[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const cleanStreetNumber = (val: string): string => {
    // Handle REINZ format: ="28" -> 28, ="6/29" -> 6/29
    return val?.replace(/^="|"$/g, '').trim() || '';
  };

  const parseDate = (val: string): string | null => {
    if (!val) return null;
    try {
      const parsed = parse(val.trim(), 'd MMM yyyy', new Date());
      return format(parsed, 'yyyy-MM-dd');
    } catch {
      return null;
    }
  };

  const parseNumber = (val: string): number | null => {
    if (!val) return null;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const parsed: ParsedSale[] = dataLines.map(line => {
        // Handle CSV with potential commas in values
        const values = line.split(',').map(v => v.trim());
        
        return {
          street_number: cleanStreetNumber(values[0] || ''),
          street_name: values[1]?.trim() || '',
          sale_price: parseNumber(values[2]),
          sale_date: parseDate(values[3]),
          days_to_sell: parseNumber(values[4]) ? Math.floor(parseNumber(values[4])!) : null,
          valuation: parseNumber(values[6]),
          bedrooms: parseNumber(values[7]) ? Math.floor(parseNumber(values[7])!) : null,
          floor_area: parseNumber(values[8]),
          land_area: parseNumber(values[10]), // Using m2 column
        };
      }).filter(sale => sale.street_name); // Filter out empty rows

      setParsedData(parsed);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    if (!suburb || !city) {
      toast({
        title: 'Missing location',
        description: 'Please select suburb and city before importing',
        variant: 'destructive',
      });
      return;
    }

    if (parsedData.length === 0) {
      toast({
        title: 'No data',
        description: 'Please upload a CSV file first',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const salesData = parsedData.map(sale => ({
        street_number: sale.street_number,
        street_name: sale.street_name,
        address: `${sale.street_number} ${sale.street_name}, ${suburb}`,
        suburb,
        city,
        sale_price: sale.sale_price,
        sale_date: sale.sale_date,
        days_to_sell: sale.days_to_sell,
        valuation: sale.valuation,
        bedrooms: sale.bedrooms,
        floor_area: sale.floor_area,
        land_area: sale.land_area,
        source_file: fileName,
      }));

      const { error } = await supabase
        .from('nearby_sales')
        .upsert(salesData, { 
          onConflict: 'street_number,street_name,suburb,city',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: 'Import successful',
        description: `Imported ${parsedData.length} sales for ${suburb}`,
      });

      setParsedData([]);
      setFileName('');
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload REINZ Sales Data
        </CardTitle>
        <CardDescription>
          Import sales data from REINZ CSV exports. Select suburb and city first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Selectors */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="suburb">Suburb *</Label>
            <Select value={suburb} onValueChange={setSuburb}>
              <SelectTrigger>
                <SelectValue placeholder="Select suburb" />
              </SelectTrigger>
              <SelectContent>
                {AUCKLAND_SUBURBS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>REINZ CSV File</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {fileName || 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                CSV files from REINZ Statistics Export
              </p>
            </label>
          </div>
        </div>

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-success" />
                {parsedData.length} sales parsed from {fileName}
              </div>
              <Button onClick={handleImport} disabled={isUploading || !suburb}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import to {suburb || 'Select suburb'}</>
                )}
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Sale Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Beds</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((sale, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {sale.street_number} {sale.street_name}
                        </TableCell>
                        <TableCell>{formatPrice(sale.sale_price)}</TableCell>
                        <TableCell>{sale.sale_date || '-'}</TableCell>
                        <TableCell>{sale.days_to_sell ?? '-'}</TableCell>
                        <TableCell>{sale.bedrooms ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 10 && (
                <div className="p-2 text-center text-sm text-muted-foreground border-t bg-muted/50">
                  Showing 10 of {parsedData.length} records
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {parsedData.length === 0 && !fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            Upload a REINZ CSV to see preview and import sales data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
