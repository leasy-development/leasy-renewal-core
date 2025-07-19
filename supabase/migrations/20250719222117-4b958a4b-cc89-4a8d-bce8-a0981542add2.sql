-- Create ai_generation_queue table for scalable processing
CREATE TABLE IF NOT EXISTS public.ai_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('title', 'description', 'meta_description', 'summary', 'tags', 'translation')),
  target_language TEXT CHECK (target_language IN ('en', 'de')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ai_versions table for field-level version history
CREATE TABLE IF NOT EXISTS public.ai_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- e.g. 'title_en', 'description_de'
  content TEXT NOT NULL,
  prompt_version TEXT,
  ai_generated BOOLEAN DEFAULT true,
  quality_score INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add AI-related fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_optimized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS content_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS translation_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS listing_segment TEXT CHECK (listing_segment IN ('luxury', 'student', 'family', 'business', 'budget'));

-- Enable RLS on new tables
ALTER TABLE public.ai_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_generation_queue
CREATE POLICY "Users can manage their own generation queue" 
ON public.ai_generation_queue 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all generation queue" 
ON public.ai_generation_queue 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for ai_versions
CREATE POLICY "Users can view versions for their properties" 
ON public.ai_versions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = ai_versions.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can create versions for their properties" 
ON public.ai_versions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = ai_versions.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all versions" 
ON public.ai_versions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_status ON public.ai_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_user_id ON public.ai_generation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_versions_property_field ON public.ai_versions(property_id, field_name);

-- Add trigger for updating timestamps
CREATE TRIGGER update_ai_generation_queue_updated_at
BEFORE UPDATE ON public.ai_generation_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();