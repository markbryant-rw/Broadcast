import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePlatformAdmin() {
  const { user } = useAuth();

  const { data: isPlatformAdmin = false, isLoading } = useQuery({
    queryKey: ['platform-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'platform_admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking platform admin status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
  });

  return { isPlatformAdmin, isLoading };
}
