-- Add baseline columns to tasks table for tracking planned vs actual dates
ALTER TABLE public.tasks 
ADD COLUMN baseline_due_date timestamp with time zone DEFAULT NULL,
ADD COLUMN baseline_estimated_hours numeric DEFAULT NULL;