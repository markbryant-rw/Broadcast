import { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSMSTemplates } from '@/hooks/useSMSTemplates';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { Opportunity } from '@/hooks/useOpportunities';
import { NearbySale } from '@/hooks/useNearbySales';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuickSMSComposerProps {
  opportunity: Opportunity | null;
  sale: NearbySale | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_SMS_LENGTH = 160;

function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function QuickSMSComposer({
  opportunity,
  sale,
  isOpen,
  onClose,
}: QuickSMSComposerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { templates } = useSMSTemplates();
  const { logSMS } = useSMSLogs();

  // Find the Nearby Sale Alert template
  const saleAlertTemplate = templates.find(
    t => t.name.toLowerCase().includes('nearby') || t.category === 'nearby_sale'
  );

  // Process message with merge fields
  const processMessage = (text: string): string => {
    if (!opportunity || !sale) return text;

    const { contact } = opportunity;

    return text
      .replace(/\{\{first_name\}\}/gi, contact.first_name || 'there')
      .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
      .replace(/\{\{sale_address\}\}/gi, sale.address)
      .replace(/\{\{sale_price\}\}/gi, formatPrice(sale.sale_price))
      .replace(/\{\{contact_address\}\}/gi, contact.address || 'your property');
  };

  // Set default template when opening
  useEffect(() => {
    if (isOpen && saleAlertTemplate) {
      setMessage(saleAlertTemplate.body);
    } else if (isOpen && !saleAlertTemplate) {
      // Default message if no template exists
      setMessage(
        `Hi {{first_name}}, a property near you at {{sale_address}} just sold for {{sale_price}}. Wondering what your home might be worth? I'd be happy to provide a free appraisal. Reply YES for more info!`
      );
    }
  }, [isOpen, saleAlertTemplate]);

  const processedMessage = processMessage(message);
  const characterCount = processedMessage.length;
  const isOverLimit = characterCount > MAX_SMS_LENGTH;


  const handleSend = async () => {
    if (!opportunity || !sale) return;

    const { contact } = opportunity;

    if (!contact.phone) {
      toast.error('Contact has no phone number');
      return;
    }

    setIsSending(true);

    try {
      // Log the SMS
      await logSMS.mutateAsync({
        contact_id: contact.id,
        phone_number: contact.phone,
        message_body: processedMessage,
        trigger_type: 'nearby_sale',
        trigger_property_address: sale.address,
        related_sale_id: sale.id,
      });

      // Sync to AgentBuddy in background (don't await)

      // Open native SMS app
      const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(processedMessage)}`;
      window.location.href = smsUrl;

      toast.success('SMS opened in your messaging app');
      onClose();
    } catch (error) {
      console.error('Failed to log SMS:', error);
      toast.error('Failed to prepare SMS');
    } finally {
      setIsSending(false);
    }
  };

  if (!opportunity || !sale) return null;

  const { contact } = opportunity;

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Quick SMS
          </SheetTitle>
          <SheetDescription>
            Send a nearby sale alert to {contact.first_name || 'this contact'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Recipient Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="text-sm font-medium">
              {contact.first_name} {contact.last_name}
            </div>
            <div className="text-sm text-muted-foreground">{contact.phone}</div>
            {contact.address && (
              <div className="text-xs text-muted-foreground mt-1">{contact.address}</div>
            )}
          </div>

          {/* Sale Info */}
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="text-xs font-medium text-primary mb-1">Triggering Sale</div>
            <div className="text-sm font-medium">{sale.address}</div>
            <div className="text-lg font-display font-bold text-gradient">
              {formatPrice(sale.sale_price)}
            </div>
          </div>

          {/* Message Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Message</label>
              <Badge variant={isOverLimit ? 'destructive' : 'secondary'}>
                {characterCount}/{MAX_SMS_LENGTH}
              </Badge>
            </div>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Preview</div>
            <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
              {processedMessage}
            </div>
          </div>

          {/* Merge Fields Info */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">{'{{first_name}}'}</Badge>
            <Badge variant="outline" className="text-xs">{'{{sale_address}}'}</Badge>
            <Badge variant="outline" className="text-xs">{'{{sale_price}}'}</Badge>
            <Badge variant="outline" className="text-xs">{'{{contact_address}}'}</Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleSend}
              disabled={!contact.phone || isOverLimit}
            >
              <Send className="h-4 w-4" />
              Send SMS
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
