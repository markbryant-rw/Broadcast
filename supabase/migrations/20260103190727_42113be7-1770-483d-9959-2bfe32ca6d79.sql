-- Create achievements table for badge definitions
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table for tracking unlocks
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by all authenticated users
CREATE POLICY "Authenticated users can view achievements"
ON public.achievements FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can view their own unlocked achievements
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Seed achievement definitions
INSERT INTO public.achievements (key, name, description, icon, criteria_type, criteria_value, rarity) VALUES
  ('first_message', 'First Steps', 'Send your first SMS message', '🚀', 'sms_count', 1, 'common'),
  ('first_campaign', 'Campaign Creator', 'Send your first email campaign', '📧', 'campaign_count', 1, 'common'),
  ('connector', 'Connector', 'Add 10 contacts to your database', '🔗', 'contacts_count', 10, 'common'),
  ('networker', 'Networker', 'Build a network of 50 contacts', '🌐', 'contacts_count', 50, 'uncommon'),
  ('power_texter', 'Power Texter', 'Send 100 SMS messages', '💬', 'sms_count', 100, 'uncommon'),
  ('sms_legend', 'SMS Legend', 'Send 500 SMS messages', '🏆', 'sms_count', 500, 'rare'),
  ('email_master', 'Email Master', 'Achieve 40% open rate on campaigns', '📬', 'email_open_rate', 40, 'rare'),
  ('inbox_hero', 'Inbox Hero', 'Achieve 50% open rate on campaigns', '🦸', 'email_open_rate', 50, 'epic'),
  ('streak_starter', 'Streak Starter', 'Maintain a 7-day activity streak', '🔥', 'streak_days', 7, 'uncommon'),
  ('streak_master', 'Streak Master', 'Maintain a 30-day activity streak', '⚡', 'streak_days', 30, 'epic'),
  ('early_bird', 'Early Bird', 'Send a message before 8am', '🌅', 'time_based', 8, 'common'),
  ('night_owl', 'Night Owl', 'Send a message after 10pm', '🦉', 'time_based', 22, 'common');