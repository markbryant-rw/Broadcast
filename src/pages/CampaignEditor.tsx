import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import EmailEditor from '@/components/email-editor/EmailEditor';
import { toast } from 'sonner';

export default function CampaignEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaigns, updateCampaign } = useCampaigns();
  
  const campaign = campaigns.find(c => c.id === id);
  
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    from_name: campaign?.from_name || '',
    from_email: campaign?.from_email || '',
    content: (campaign?.content as { html?: string })?.html || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

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
    } catch (error) {
      toast.error('Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (data: { html: string; subject: string }) => {
    setFormData(prev => ({
      ...prev,
      content: data.html,
      subject: data.subject,
    }));
  };

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button variant="link" onClick={() => navigate('/campaigns')}>
            Back to campaigns
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">{formData.name || 'Edit Campaign'}</h1>
              <p className="text-muted-foreground">Design your email content</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button className="gradient-primary">
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings Sidebar */}
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
          </div>

          {/* Email Editor */}
          <div className="lg:col-span-2">
            <EmailEditor
              initialContent={formData.content}
              initialSubject={formData.subject}
              onChange={handleEditorChange}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
