import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserSettings {
  cooldownDays: number;
  searchRadiusMeters: number;
  weeklyContactGoal: number;
  weeklySmSGoal: number;
}

const defaultSettings: UserSettings = {
  cooldownDays: 7,
  searchRadiusMeters: 500,
  weeklyContactGoal: 50,
  weeklySmSGoal: 100,
};

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<UserSettings> => {
      if (!user) return defaultSettings;

      // For now, use local storage as a simple persistence mechanism
      // In the future, this could be stored in the profiles table
      const stored = localStorage.getItem(`user-settings-${user.id}`);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
      return defaultSettings;
    },
    enabled: !!user,
  });
}

export function useUpdateUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get current settings
      const stored = localStorage.getItem(`user-settings-${user.id}`);
      const current = stored ? JSON.parse(stored) : defaultSettings;
      
      // Merge and save
      const updated = { ...current, ...settings };
      localStorage.setItem(`user-settings-${user.id}`, JSON.stringify(updated));
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({ title: 'Settings saved' });
    },
    onError: () => {
      toast({
        title: 'Error saving settings',
        variant: 'destructive',
      });
    },
  });
}
