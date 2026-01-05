import SMSLayout from '@/components/layout/SMSLayout';
import SMSTemplateManager from '@/components/sms/SMSTemplateManager';

export default function SMSTemplates() {
  return (
    <SMSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">SMS Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your SMS message templates
          </p>
        </div>

        <SMSTemplateManager />
      </div>
    </SMSLayout>
  );
}
