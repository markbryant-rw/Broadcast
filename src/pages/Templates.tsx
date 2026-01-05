import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailLayout from '@/components/layout/EmailLayout';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Loader2 } from 'lucide-react';

export default function Templates() {
  const navigate = useNavigate();
  const { isPlatformAdmin, isLoading } = usePlatformAdmin();

  // Redirect non-platform admins to dashboard
  useEffect(() => {
    if (!isLoading && !isPlatformAdmin) {
      navigate('/dashboard');
    }
  }, [isPlatformAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <EmailLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </EmailLayout>
    );
  }

  if (!isPlatformAdmin) {
    return null;
  }

  return (
    <EmailLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Browse pre-designed templates or manage your saved templates
          </p>
        </div>

        <TemplateLibrary mode="manage" />
      </div>
    </EmailLayout>
  );
}
