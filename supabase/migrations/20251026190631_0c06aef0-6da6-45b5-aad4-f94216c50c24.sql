-- Add length constraint to chat_messages content to prevent database overflow
ALTER TABLE chat_messages ADD CONSTRAINT content_length_check CHECK (length(content) <= 4000);

-- Update profiles RLS policy to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Note: Users can still update their own profiles and insert their own profile (existing policies remain)