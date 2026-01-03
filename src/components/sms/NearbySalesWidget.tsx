import { useState } from 'react';
import { format } from 'date-fns';
import { Home, MapPin, DollarSign, MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useContactsWithNearbySales } from '@/hooks/useNearbySales';
import SMSComposer from './SMSComposer';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  address_suburb: string | null;
}

interface NearbySale {
  id: string;
  address: string;
  suburb: string;
  sale_price: number | null;
  sale_date: string | null;
  property_type: string | null;
}

export default function NearbySalesWidget() {
  const { data: matches, isLoading } = useContactsWithNearbySales();
  const [selectedMatch, setSelectedMatch] = useState<{
    contact: Contact;
    sale: NearbySale;
  } | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Nearby Sales Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Nearby Sales Alerts
          </CardTitle>
          <CardDescription>
            When properties near your contacts sell, you'll see alerts here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No nearby sales detected for your contacts
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add addresses to contacts to enable proximity matching
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Nearby Sales Alerts
            <Badge variant="secondary" className="ml-2">
              {matches.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Properties that sold near your contacts in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {matches.slice(0, 5).map((match: any, index: number) => {
            const latestSale = match.nearbySales[0];
            return (
              <div
                key={`${match.contact.id}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {match.contact.first_name || match.contact.email}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{match.contact.address_suburb}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {match.nearbySales.length} sale{match.nearbySales.length > 1 ? 's' : ''} nearby
                    </Badge>
                    {latestSale.sale_price && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {new Intl.NumberFormat('en-NZ', {
                          style: 'currency',
                          currency: 'NZD',
                          maximumFractionDigits: 0,
                        }).format(latestSale.sale_price)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedMatch({
                    contact: match.contact,
                    sale: latestSale,
                  })}
                  disabled={!match.contact.phone}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Notify
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* SMS Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Nearby Sale Alert</DialogTitle>
            <DialogDescription>
              {selectedMatch?.sale.address} sold
              {selectedMatch?.sale.sale_date && ` on ${format(new Date(selectedMatch.sale.sale_date), 'MMM d, yyyy')}`}
              {selectedMatch?.sale.sale_price && ` for ${new Intl.NumberFormat('en-NZ', {
                style: 'currency',
                currency: 'NZD',
                maximumFractionDigits: 0,
              }).format(selectedMatch.sale.sale_price)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <SMSComposer
              contact={selectedMatch.contact}
              triggerType="nearby_sale"
              triggerPropertyAddress={selectedMatch.sale.address}
              salePrice={selectedMatch.sale.sale_price}
              onSent={() => setSelectedMatch(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
