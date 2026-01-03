import { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSMSTemplates } from '@/hooks/useSMSTemplates';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { toast } from 'sonner';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address?: string | null;
}

interface SMSComposerProps {
  contact: Contact | null;
  triggerType?: string;
  triggerPropertyAddress?: string;
  onSent?: () => void;
}

const MAX_SMS_LENGTH = 160;

const MERGE_FIELDS = [
  { key: '{{first_name}}', label: 'First Name' },
  { key: '{{last_name}}', label: 'Last Name' },
  { key: '{{address}}', label: 'Address' },
];

export default function SMSComposer({ 
  contact, 
  triggerType = 'manual',
  triggerPropertyAddress,
  onSent 
}: SMSComposerProps) {
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const { templates } = useSMSTemplates();
  const { logSMS } = useSMSLogs();

  // Apply merge fields to message
  const getProcessedMessage = () => {
    if (!contact) return message;
    
    return message
      .replace(/\{\{first_name\}\}/g, contact.first_name || '')
      .replace(/\{\{last_name\}\}/g, contact.last_name || '')
      .replace(/\{\{address\}\}/g, contact.address || '');
  };

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.body);
    }
  };

  // Insert merge field at cursor
  const insertMergeField = (field: string) => {
    setMessage(prev => prev + field);
  };

  // Handle send via URL scheme
  const handleSend = async () => {
    if (!contact?.phone) {
      toast.error('No phone number available for this contact');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const processedMessage = getProcessedMessage();
    
    // Format phone number (ensure it starts with +64 for NZ)
    let phoneNumber = contact.phone.replace(/\s/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+64' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+64' + phoneNumber;
    }

    // Create SMS URL
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(processedMessage)}`;
    
    // Log the SMS before opening
    try {
      await logSMS.mutateAsync({
        contact_id: contact.id,
        phone_number: phoneNumber,
        message_body: processedMessage,
        template_id: selectedTemplateId || undefined,
        trigger_type: triggerType,
        trigger_property_address: triggerPropertyAddress,
      });
      
      // Open native SMS app
      window.location.href = smsUrl;
      
      toast.success('SMS app opened - message logged');
      onSent?.();
    } catch (error) {
      toast.error('Failed to log SMS');
    }
  };

  const charCount = getProcessedMessage().length;
  const isOverLimit = charCount > MAX_SMS_LENGTH;

  return (
    <div className="space-y-4">
      {/* Contact info */}
      {contact ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {contact.first_name || contact.last_name 
                ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                : contact.email}
            </p>
            {contact.phone ? (
              <p className="text-sm text-muted-foreground">{contact.phone}</p>
            ) : (
              <p className="text-sm text-destructive">No phone number</p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-muted-foreground/25 text-center text-muted-foreground">
          Select a contact to compose an SMS
        </div>
      )}

      {/* Template selector */}
      <div className="space-y-2">
        <Label>Template (optional)</Label>
        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  {template.category && (
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Merge fields */}
      <div className="space-y-2">
        <Label>Merge Fields</Label>
        <div className="flex flex-wrap gap-2">
          {MERGE_FIELDS.map(field => (
            <Button
              key={field.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertMergeField(field.key)}
            >
              {field.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Message textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Message</Label>
          <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {charCount}/{MAX_SMS_LENGTH}
          </span>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[120px] resize-none"
        />
        {isOverLimit && (
          <p className="text-xs text-destructive">
            Message exceeds 160 characters and may be split into multiple SMS
          </p>
        )}
      </div>

      {/* Preview */}
      {message && contact && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="p-3 rounded-lg bg-muted text-sm">
            {getProcessedMessage()}
          </div>
        </div>
      )}

      {/* Send button */}
      <Button 
        onClick={handleSend} 
        disabled={!contact?.phone || !message.trim()}
        className="w-full gradient-primary"
      >
        <Send className="h-4 w-4 mr-2" />
        Open SMS App
      </Button>
    </div>
  );
}
