-- Media Intelligence Engine Database Schema

-- Create enum for image categories
CREATE TYPE public.image_category AS ENUM (
  'main_bedroom',
  'second_bedroom', 
  'third_bedroom',
  'main_bathroom',
  'second_bathroom',
  'kitchen',
  'living_room',
  'dining_room',
  'balcony',
  'terrace',
  'outside',
  'entrance',
  'hallway',
  'storage',
  'other'
);

-- Create enum for image sources
CREATE TYPE public.image_source AS ENUM (
  'manual_upload',
  'bulk_import',
  'scraper',
  'ai_generated'
);

-- Image hashes table for deduplication
CREATE TABLE public.image_hashes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  hash_type TEXT NOT NULL DEFAULT 'phash',
  hash_value TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hash_value, hash_type)
);

-- AI categorization results
CREATE TABLE public.image_categorization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  predicted_category image_category,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  final_category image_category,
  is_auto_assigned BOOLEAN DEFAULT false,
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Image audit trail
CREATE TABLE public.image_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  source_type image_source NOT NULL,
  source_url TEXT,
  original_filename TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  health_check_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User feedback for model improvement
CREATE TABLE public.categorization_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_categorization_id UUID REFERENCES public.image_categorization(id) ON DELETE CASCADE,
  original_prediction image_category,
  corrected_category image_category NOT NULL,
  user_id UUID NOT NULL,
  feedback_type TEXT DEFAULT 'manual_correction',
  confidence_before NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Model versions and performance tracking
CREATE TABLE public.ai_model_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL DEFAULT 'image_classification',
  accuracy_score NUMERIC(5,4),
  precision_score NUMERIC(5,4),
  recall_score NUMERIC(5,4),
  training_samples_count INTEGER,
  is_active BOOLEAN DEFAULT false,
  deployment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Floorplan analysis results
CREATE TABLE public.floorplan_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  floorplan_url TEXT NOT NULL,
  extracted_text TEXT,
  room_data JSONB DEFAULT '{}',
  dimensions_data JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2),
  analysis_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.image_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_categorization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floorplan_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_hashes
CREATE POLICY "Users can manage image hashes for their properties" 
ON public.image_hashes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = image_hashes.property_id 
  AND properties.user_id = auth.uid()
));

-- RLS Policies for image_categorization
CREATE POLICY "Users can manage categorization for their properties" 
ON public.image_categorization 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = image_categorization.property_id 
  AND properties.user_id = auth.uid()
));

-- RLS Policies for image_audit_trail
CREATE POLICY "Users can view audit trail for their properties" 
ON public.image_audit_trail 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = image_audit_trail.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert audit trail for their properties" 
ON public.image_audit_trail 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = image_audit_trail.property_id 
  AND properties.user_id = auth.uid()
));

-- RLS Policies for categorization_feedback
CREATE POLICY "Users can create feedback for their images" 
ON public.categorization_feedback 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for ai_model_versions
CREATE POLICY "Anyone can view active model versions" 
ON public.ai_model_versions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage model versions" 
ON public.ai_model_versions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for floorplan_analysis
CREATE POLICY "Users can manage floorplan analysis for their properties" 
ON public.floorplan_analysis 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = floorplan_analysis.property_id 
  AND properties.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_image_hashes_property_id ON public.image_hashes(property_id);
CREATE INDEX idx_image_hashes_hash_value ON public.image_hashes(hash_value);
CREATE INDEX idx_image_categorization_property_id ON public.image_categorization(property_id);
CREATE INDEX idx_image_audit_trail_property_id ON public.image_audit_trail(property_id);
CREATE INDEX idx_categorization_feedback_image_id ON public.categorization_feedback(image_categorization_id);
CREATE INDEX idx_floorplan_analysis_property_id ON public.floorplan_analysis(property_id);

-- Add triggers for updated_at
CREATE TRIGGER update_image_categorization_updated_at
  BEFORE UPDATE ON public.image_categorization
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial model version
INSERT INTO public.ai_model_versions (version_name, model_type, is_active, deployment_date)
VALUES ('v1.0', 'image_classification', true, now());

-- Add sort_order to property_media for automatic sorting
ALTER TABLE public.property_media 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_category image_category,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2);