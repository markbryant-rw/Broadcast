import { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, ChevronRight, Check, X, Pause, Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface BulkSMSComposerProps {
  opportunities: Opportunity[];
  sale: NearbySale | null;
  isOpen: boolean;
  onClose: () => void;
}

type QueueStatus = 'pending' | 'current' | 'sent' | 'skipped';

interface QueueItem {
  opportunity: Opportunity;
  status: QueueStatus;
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

export default function BulkSMSComposer({
  opportunities,
  sale,
  isOpen,
  onClose,
}: BulkSMSComposerProps) {
  const [messageTemplate, setMessageTemplate] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { templates } = useSMSTemplates();
  const { logSMS } = useSMSLogs();

  // Find the Nearby Sale Alert template
  const saleAlertTemplate = templates.find(
    t => t.name.toLowerCase().includes('nearby') || t.category === 'nearby_sale'
  );

  // Initialize queue when opportunities change
  useEffect(() => {
    if (isOpen) {
      const validOpportunities = opportunities.filter(o => o.contact.phone);
      setQueue(validOpportunities.map(opp => ({ opportunity: opp, status: 'pending' as QueueStatus })));
      setCurrentIndex(0);
      setIsStarted(false);
      setIsPaused(false);
    }
  }, [isOpen, opportunities]);

  // Set default template when opening
  useEffect(() => {
    if (isOpen && saleAlertTemplate) {
      setMessageTemplate(saleAlertTemplate.body);
    } else if (isOpen && !saleAlertTemplate) {
      setMessageTemplate(
        `Hi {{first_name}}, a property near you at {{sale_address}} just sold for {{sale_price}}. Wondering what your home might be worth? I'd be happy to provide a free appraisal. Reply YES for more info!`
      );
    }
  }, [isOpen, saleAlertTemplate]);

  // Process message with merge fields for a specific contact
  const processMessage = useCallback((text: string, opportunity: Opportunity): string => {
    if (!sale) return text;

    const { contact } = opportunity;

    return text
      .replace(/\{\{first_name\}\}/gi, contact.first_name || 'there')
      .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
      .replace(/\{\{sale_address\}\}/gi, sale.address)
      .replace(/\{\{sale_price\}\}/gi, formatPrice(sale.sale_price))
      .replace(/\{\{contact_address\}\}/gi, contact.address || 'your property');
  }, [sale]);


  const currentOpportunity = queue[currentIndex]?.opportunity;
  const currentProcessedMessage = currentOpportunity 
    ? processMessage(messageTemplate, currentOpportunity) 
    : '';
  const characterCount = currentProcessedMessage.length;
  const isOverLimit = characterCount > MAX_SMS_LENGTH;

  const sentCount = queue.filter(q => q.status === 'sent').length;
  const skippedCount = queue.filter(q => q.status === 'skipped').length;
  const progress = queue.length > 0 ? ((sentCount + skippedCount) / queue.length) * 100 : 0;
  const isComplete = queue.length > 0 && (sentCount + skippedCount) === queue.length;

  const handleStart = () => {
    if (queue.length === 0) {
      toast.error('No contacts with phone numbers to send to');
      return;
    }
    setIsStarted(true);
    // Mark first as current
    setQueue(prev => prev.map((item, idx) => 
      idx === 0 ? { ...item, status: 'current' } : item
    ));
  };

  const handleSendCurrent = async () => {
    if (!currentOpportunity || !sale) return;

    const { contact } = currentOpportunity;

    try {
      // Log the SMS
      await logSMS.mutateAsync({
        contact_id: contact.id,
        phone_number: contact.phone!,
        message_body: currentProcessedMessage,
        trigger_type: 'nearby_sale_bulk',
        trigger_property_address: sale.address,
        related_sale_id: sale.id,
      });

      // Sync to AgentBuddy in background

      // Mark as sent
      setQueue(prev => prev.map((item, idx) => 
        idx === currentIndex ? { ...item, status: 'sent' } : item
      ));

      // Open SMS app
      const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(currentProcessedMessage)}`;
      window.location.href = smsUrl;

      // Move to next after a short delay (user will return after sending)
      setTimeout(() => {
        moveToNext();
      }, 500);

    } catch (error) {
      console.error('Failed to log SMS:', error);
      toast.error('Failed to prepare SMS');
    }
  };

  const handleSkipCurrent = () => {
    setQueue(prev => prev.map((item, idx) => 
      idx === currentIndex ? { ...item, status: 'skipped' } : item
    ));
    moveToNext();
  };

  const moveToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      setQueue(prev => prev.map((item, idx) => 
        idx === nextIndex ? { ...item, status: 'current' } : item
      ));
    }
  };

  const handleClose = () => {
    if (isStarted && !isComplete) {
      if (!confirm(`You have ${queue.length - sentCount - skippedCount} messages remaining. Are you sure you want to exit?`)) {
        return;
      }
    }
    onClose();
  };

  // Early return if no sale - but AFTER all hooks
  if (!sale) return null;
  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk SMS
          </SheetTitle>
          <SheetDescription>
            Send to {queue.length} contacts near {sale.address}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {sentCount + skippedCount} / {queue.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex gap-3 text-xs">
              <span className="text-success">{sentCount} sent</span>
              <span className="text-muted-foreground">{skippedCount} skipped</span>
              <span className="text-primary">{queue.length - sentCount - skippedCount} remaining</span>
            </div>
          </div>

          {!isStarted ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Message Template</label>
                  <Badge variant="secondary">
                    {queue[0] ? processMessage(messageTemplate, queue[0].opportunity).length : messageTemplate.length}/{MAX_SMS_LENGTH}
                  </Badge>
                </div>
                <Textarea
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Merge Fields */}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">{'{{first_name}}'}</Badge>
                <Badge variant="outline" className="text-xs">{'{{sale_address}}'}</Badge>
                <Badge variant="outline" className="text-xs">{'{{sale_price}}'}</Badge>
                <Badge variant="outline" className="text-xs">{'{{contact_address}}'}</Badge>
              </div>

              {/* Queue Preview */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Recipients ({queue.length})</div>
                <ScrollArea className="h-[150px] rounded-lg border">
                  <div className="p-2 space-y-1">
                    {queue.map((item, idx) => (
                      <div key={item.opportunity.contact.id} className="flex items-center gap-2 p-2 rounded text-sm bg-muted/30">
                        <span className="text-muted-foreground">{idx + 1}.</span>
                        <span className="font-medium truncate flex-1">
                          {item.opportunity.contact.first_name} {item.opportunity.contact.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.opportunity.contact.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Start Button */}
              <Button
                className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleStart}
                disabled={queue.length === 0}
              >
                <Send className="h-4 w-4" />
                Start Sending ({queue.length} contacts)
              </Button>
            </>
          ) : isComplete ? (
            /* Completion State */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-success/20 p-4 mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">All Done!</h3>
              <p className="text-muted-foreground mb-6">
                Sent {sentCount} messages, skipped {skippedCount}
              </p>
              <Button onClick={onClose} className="gap-2">
                <Check className="h-4 w-4" />
                Finish
              </Button>
            </div>
          ) : (
            /* Active Sending State */
            <>
              {/* Current Contact */}
              <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Now Sending ({currentIndex + 1} of {queue.length})
                </div>
                <div className="font-semibold text-lg">
                  {currentOpportunity?.contact.first_name} {currentOpportunity?.contact.last_name}
                </div>
                <div className="text-sm text-muted-foreground">{currentOpportunity?.contact.phone}</div>
                {currentOpportunity?.contact.address && (
                  <div className="text-xs text-muted-foreground mt-1">{currentOpportunity.contact.address}</div>
                )}
              </div>

              {/* Message Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Message Preview</label>
                  <Badge variant={isOverLimit ? 'destructive' : 'secondary'}>
                    {characterCount}/{MAX_SMS_LENGTH}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                  {currentProcessedMessage}
                </div>
              </div>

              {/* Send/Skip Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkipCurrent}
                >
                  <X className="h-4 w-4 mr-2" />
                  Skip
                </Button>
                <Button
                  className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={handleSendCurrent}
                  disabled={isOverLimit}
                >
                  <Send className="h-4 w-4" />
                  Send & Open SMS
                </Button>
              </div>

              {/* Upcoming Queue */}
              {currentIndex + 1 < queue.length && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Coming Up</div>
                  <ScrollArea className="h-[100px] rounded-lg border">
                    <div className="p-2 space-y-1">
                      {queue.slice(currentIndex + 1).map((item, idx) => (
                        <div key={item.opportunity.contact.id} className="flex items-center gap-2 p-2 rounded text-sm bg-muted/30">
                          <span className="text-muted-foreground">{currentIndex + idx + 2}.</span>
                          <span className="truncate flex-1">
                            {item.opportunity.contact.first_name} {item.opportunity.contact.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
