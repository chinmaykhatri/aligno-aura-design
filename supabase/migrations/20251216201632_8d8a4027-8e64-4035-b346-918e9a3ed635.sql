-- Add story_points column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN story_points integer DEFAULT NULL;

-- Add baseline_story_points for sprint planning tracking
ALTER TABLE public.tasks 
ADD COLUMN baseline_story_points integer DEFAULT NULL;