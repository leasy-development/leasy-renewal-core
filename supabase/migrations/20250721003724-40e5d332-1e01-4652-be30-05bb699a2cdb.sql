-- Security improvements: Make critical user_id fields non-nullable where appropriate

-- Update AI generation queue to ensure user_id is always set
ALTER TABLE public.ai_generation_queue 
ALTER COLUMN user_id SET NOT NULL;

-- Update categorization feedback to ensure user_id is always set
ALTER TABLE public.categorization_feedback 
ALTER COLUMN user_id SET NOT NULL;

-- Update deepsource_issues to ensure user_id is always set
ALTER TABLE public.deepsource_issues 
ALTER COLUMN user_id SET NOT NULL;

-- Update deepsource_repositories to ensure user_id is always set
ALTER TABLE public.deepsource_repositories 
ALTER COLUMN user_id SET NOT NULL;

-- Update deepsource_scans to ensure user_id is always set
ALTER TABLE public.deepsource_scans 
ALTER COLUMN user_id SET NOT NULL;

-- Update duplicate_detection_log to ensure admin_user_id is always set
ALTER TABLE public.duplicate_detection_log 
ALTER COLUMN admin_user_id SET NOT NULL;

-- Update duplicate_false_positives to ensure admin_user_id is always set
ALTER TABLE public.duplicate_false_positives 
ALTER COLUMN admin_user_id SET NOT NULL;

-- Update field_mapping_memory to ensure user_id is always set
ALTER TABLE public.field_mapping_memory 
ALTER COLUMN user_id SET NOT NULL;

-- Update user_roles to ensure user_id is always set
ALTER TABLE public.user_roles 
ALTER COLUMN user_id SET NOT NULL;

-- Update properties to ensure user_id is always set (this should already be non-nullable)
ALTER TABLE public.properties 
ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure profiles always have user_id
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;