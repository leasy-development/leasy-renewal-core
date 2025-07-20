-- Add missing tables for Media Intelligence Engine

-- Create enum for source types if not exists
DO $$ BEGIN
    CREATE TYPE public.media_source AS ENUM ('manual_upload', 'bulk_import', 'scraper');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create media_category_feedback_log table
CREATE TABLE IF NOT EXISTS public.media_category_feedback_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash UUID,
  original_prediction TEXT,
  corrected_category TEXT NOT NULL,
  corrected_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create floorplan_files table  
CREATE TABLE IF NOT EXISTS public.floorplan_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  parsed_rooms JSONB DEFAULT '{}',
  parsed_dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.media_category_feedback_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floorplan_files ENABLE ROW LEVEL SECURITY;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_category_feedback_log_image_hash ON public.media_category_feedback_log(image_hash);
CREATE INDEX IF NOT EXISTS idx_floorplan_files_property_id ON public.floorplan_files(property_id);