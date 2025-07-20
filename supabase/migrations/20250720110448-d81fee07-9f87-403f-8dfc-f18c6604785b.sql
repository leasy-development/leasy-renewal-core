-- Update Media Intelligence Engine Schema with specified tables

-- Create enum for source types
CREATE TYPE public.media_source AS ENUM ('manual_upload', 'bulk_import', 'scraper');

-- Create property_media_hashes table
CREATE TABLE public.property_media_hashes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_hash TEXT NOT NULL UNIQUE,
  source media_source NOT NULL,
  upload_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_category_prediction TEXT,
  ai_confidence FLOAT,
  final_category TEXT,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES public.property_media_hashes(id) ON DELETE SET NULL
);

-- Create media_category_feedback_log table
CREATE TABLE public.media_category_feedback_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash UUID REFERENCES public.property_media_hashes(id) ON DELETE CASCADE,
  original_prediction TEXT,
  corrected_category TEXT NOT NULL,
  corrected_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create floorplan_files table
CREATE TABLE public.floorplan_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  parsed_rooms JSONB DEFAULT '{}',
  parsed_dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update ai_model_versions table to match specification
ALTER TABLE public.ai_model_versions 
DROP COLUMN IF EXISTS version_name,
DROP COLUMN IF EXISTS model_type,
DROP COLUMN IF EXISTS training_samples_count,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS deployment_date,
DROP COLUMN IF EXISTS metadata;

ALTER TABLE public.ai_model_versions 
ADD COLUMN IF NOT EXISTS version TEXT PRIMARY KEY,
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accuracy FLOAT,
ADD COLUMN IF NOT EXISTS precision FLOAT,
ADD COLUMN IF NOT EXISTS recall FLOAT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable RLS on new tables
ALTER TABLE public.property_media_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_category_feedback_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floorplan_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_media_hashes
CREATE POLICY "Users can manage media hashes for their properties" 
ON public.property_media_hashes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = property_media_hashes.property_id 
  AND properties.user_id = auth.uid()
));

-- RLS Policies for media_category_feedback_log
CREATE POLICY "Users can create feedback for their images" 
ON public.media_category_feedback_log 
FOR ALL 
USING (auth.uid() = corrected_by);

-- RLS Policies for floorplan_files
CREATE POLICY "Users can manage floorplans for their properties" 
ON public.floorplan_files 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = floorplan_files.property_id 
  AND properties.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_property_media_hashes_property_id ON public.property_media_hashes(property_id);
CREATE INDEX idx_property_media_hashes_image_hash ON public.property_media_hashes(image_hash);
CREATE INDEX idx_property_media_hashes_source ON public.property_media_hashes(source);
CREATE INDEX idx_media_category_feedback_log_image_hash ON public.media_category_feedback_log(image_hash);
CREATE INDEX idx_floorplan_files_property_id ON public.floorplan_files(property_id);