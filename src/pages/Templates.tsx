import DashboardLayout from '@/components/layout/DashboardLayout';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';

export default function Templates() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Browse pre-designed templates or manage your saved templates
          </p>
        </div>

        <TemplateLibrary mode="manage" />
      </div>
    </DashboardLayout>
  );
}
