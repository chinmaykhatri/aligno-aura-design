-- Create user gamification table to track XP and levels
CREATE TABLE public.user_gamification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    total_xp integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    tasks_completed integer NOT NULL DEFAULT 0,
    current_streak integer NOT NULL DEFAULT 0,
    longest_streak integer NOT NULL DEFAULT 0,
    last_activity_date date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- Users can view their own gamification data
CREATE POLICY "Users can view their own gamification"
ON public.user_gamification
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own gamification record
CREATE POLICY "Users can insert their own gamification"
ON public.user_gamification
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own gamification record
CREATE POLICY "Users can update their own gamification"
ON public.user_gamification
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_user_gamification_user_id ON public.user_gamification(user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();