-- Make the chat-attachments bucket private to prevent unauthorized access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-attachments';