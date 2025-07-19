-- Add missing columns to existing tables for enhanced prompt management
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS created_by uuid;

-- Rename ai_prompt_versions to ai_prompt_history for consistency with requirements
ALTER TABLE ai_prompt_versions RENAME TO ai_prompt_history;

-- Add missing columns to history table
ALTER TABLE ai_prompt_history ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE ai_prompt_history RENAME COLUMN created_by TO updated_by;
ALTER TABLE ai_prompt_history RENAME COLUMN created_at TO updated_at;

-- Update RLS policies for renamed table
DROP POLICY IF EXISTS "Admins can create prompt versions" ON ai_prompt_history;
DROP POLICY IF EXISTS "Admins can view all prompt versions" ON ai_prompt_history;

CREATE POLICY "Admins can create prompt history" 
ON ai_prompt_history 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all prompt history" 
ON ai_prompt_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add meta_description prompt type if not exists
INSERT INTO ai_prompts (type, name, prompt) 
VALUES ('meta_description', 'Meta Description Generator', 'Generate a compelling SEO meta description (max 160 characters) for this property listing. Focus on key features, location, and what makes it appealing to potential tenants.')
ON CONFLICT (type) DO NOTHING;