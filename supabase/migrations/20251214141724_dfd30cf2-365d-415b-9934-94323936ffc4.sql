-- Add columns to store previous values for undo functionality
ALTER TABLE public.scheduling_history 
ADD COLUMN previous_value JSONB DEFAULT '{}'::jsonb,
ADD COLUMN undone BOOLEAN DEFAULT false,
ADD COLUMN undone_at TIMESTAMP WITH TIME ZONE;