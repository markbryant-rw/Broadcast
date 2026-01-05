import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import EmailLayout from '@/components/layout/EmailLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Loader2, Clock, X } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import EmailEditor from '@/components/email-editor/EmailEditor';
import { ScheduleCampaignDialog } from '@/components/campaigns/ScheduleCampaignDialog';
import { RecipientSelector, RecipientSelection } from '@/components/campaigns/RecipientSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CampaignEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaigns, updateCampaign, scheduleCampaign, cancelSchedule } = useCampaigns();
  
  const campaign = campaigns.find(c => c.id === id);
  
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    from_name: campaign?.from_name || '',
    from_email: campaign?.from_email || '',
    content: (campaign?.content as { html?: string })?.html || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [recipients, setRecipients] = useState<RecipientSelection>({ type: 'all' });

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateCampaign.mutateAsync({
        id,
        name: formData.name,
        subject: formData.subject,
        from_name: formData.from_name || null,
        from_email: formData.from_email || null,
        content: { html: formData.content },
      });
      toast.success('Campaign saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!id) return;

    // Validation
    if (!formData.subject?.trim()) {
      toast.error('Please add a subject line');
      return;
    }
    if (!formData.content?.trim()) {
      toast.error('Please add email content');
      return;
    }
    if (recipients.type === 'lists' && (!recipients.listIds || recipients.listIds.length === 0)) {
      toast.error('Please select at least one list');
      return;
    }
    if (recipients.type === 'tags' && (!recipients.tagIds || recipients.tagIds.length === 0)) {
      toast.error('Please select at least one tag');
      return;
    }
    if (recipients.type === 'manual' && (!recipients.contactIds || recipients.contactIds.length === 0)) {
      toast.error('Please select at least one contact');
      return;
    }

    setIsSending(true);
    try {
      // Save first
      await updateCampaign.mutateAsync({
        id,
        name: formData.name,
        subject: formData.subject,
        from_name: formData.from_name || null,
        from_email: formData.from_email || null,
        content: { html: formData.content },
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: {
          campaignId: id,
          recipientType: recipients.type,
          listIds: recipients.listIds,
          tagIds: recipients.tagIds,
          contactIds: recipients.contactIds,
        },
      });

      if (error) throw error;

      toast.success(`Campaign sent! ${data.sent} emails delivered.`);
      navigate('/campaigns');
    } catch (err: any) {
      console.error('Send campaign error:', err);
      toast.error(err.message || 'Failed to send campaign');
    } finally {
      setIsSending(false);
      setIsSendConfirmOpen(false);
    }
  };

  const handleSchedule = async (scheduledAt: string, timezone: string) => {
    if (!id) return;
    await scheduleCampaign.mutateAsync({ id, scheduledAt, timezone });
    setIsScheduleOpen(false);
  };

  const handleCancelSchedule = async () => {
    if (!id || !confirm('Cancel this scheduled campaign?')) return;
    await cancelSchedule.mutateAsync(id);
  };

  const handleEditorChange = (data: { html: string; subject: string }) => {
    setFormData(prev => ({ ...prev, content: data.html, subject: data.subject }));
  };

  if (!campaign) {
    return (
      <EmailLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button variant="link" onClick={() => navigate('/campaigns')}>
            Back to campaigns
          </Button>
        </div>
      </EmailLayout>
    );
  }

  const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';

  return (
    <EmailLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">{formData.name || 'Edit Campaign'}</h1>
              <p className="text-muted-foreground">Design your email content</p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {campaign.status === 'scheduled' && campaign.scheduled_at && (
              <div className="flex items-center gap-2 mr-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(campaign.scheduled_at), "MMM d, h:mm a")}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleCancelSchedule}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {campaign.status === 'sent' && (
              <Badge variant="secondary" className="mr-2">Sent</Badge>
            )}
            <Button variant="outline" onClick={handleSave} disabled={isSaving || isSending}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            {canSend && (
              <>
                <Button variant="outline" onClick={() => setIsScheduleOpen(true)} disabled={isSending}>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button 
                  className="gradient-primary" 
                  onClick={() => setIsSendConfirmOpen(true)}
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Campaign
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Campaign Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={formData.from_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <RecipientSelector value={recipients} onChange={setRecipients} />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <EmailEditor
              initialContent={formData.content}
              initialSubject={formData.subject}
              onChange={handleEditorChange}
            />
          </div>
        </div>
      </div>

      <ScheduleCampaignDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onSchedule={handleSchedule}
        isLoading={scheduleCampaign.isPending}
      />

      <AlertDialog open={isSendConfirmOpen} onOpenChange={setIsSendConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately send "{formData.name || 'this campaign'}" to your selected recipients.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendCampaign} disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EmailLayout>
  );
}