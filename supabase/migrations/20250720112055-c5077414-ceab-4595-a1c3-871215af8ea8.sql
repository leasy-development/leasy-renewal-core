-- Update mapping_training_log table to match specification
-- First, drop the existing table and recreate with proper structure
DROP TABLE IF EXISTS public.mapping_training_log;

-- Create the mapping_training_log table with proper specification
CREATE TABLE public.mapping_training_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_field text NOT NULL,         -- Field from user-uploaded file
  target_field text NOT NULL,         -- Mapped Leasy database field
  match_confidence int DEFAULT 100,   -- e.g. 90 for fuzzy matches
  mapping_type text DEFAULT 'manual', -- manual, suggested, auto, ai
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.mapping_training_log ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their own mapping logs"
ON public.mapping_training_log
FOR ALL
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_mapping_training_log_user_source ON public.mapping_training_log(user_id, source_field);

-- Create index for mapping type queries
CREATE INDEX idx_mapping_training_log_type ON public.mapping_training_log(mapping_type, created_at DESC);