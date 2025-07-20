-- ✅ ADDITIVE MIGRATION: Neue Felder für erweiterte Immobiliendaten
-- Bestehende Daten und Strukturen bleiben vollständig erhalten

-- Neue Felder für Properties erweitern (NON-DESTRUCTIVE)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS total_rooms integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS apartment_floor integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS elevator_available boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS furnished boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS smoking_allowed boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS washing_machine boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dishwasher boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS garden_access boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parking_included boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utilities_included boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS internet_included boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS energy_efficiency_class text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS heating_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS available_from date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS minimum_rental_period text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS maximum_rental_period text DEFAULT NULL;

-- Erweiterte Medien-Features (Additive)
ALTER TABLE public.property_media
ADD COLUMN IF NOT EXISTS alt_text text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_generated_alt_text text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_hash text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS width integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS height integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- Floorplan support erweitern
CREATE TABLE IF NOT EXISTS public.property_floorplans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  floorplan_url text NOT NULL,
  floorplan_type text DEFAULT 'floor_plan',
  rooms_data jsonb DEFAULT '{}',
  dimensions_data jsonb DEFAULT '{}',
  ai_analysis_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS für neue Tabelle
ALTER TABLE public.property_floorplans ENABLE ROW LEVEL SECURITY;

-- RLS Policies für Floorplans
CREATE POLICY "Users can manage floorplans for their properties" 
ON public.property_floorplans 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_floorplans.property_id 
    AND properties.user_id = auth.uid()
  )
);

-- Stadt-zu-PLZ Mapping für Auto-Vervollständigung (Erweiternde Funktionalität)
CREATE TABLE IF NOT EXISTS public.german_postcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postcode text NOT NULL,
  city text NOT NULL,
  district text DEFAULT NULL,
  state text DEFAULT NULL,
  latitude decimal(10, 8) DEFAULT NULL,
  longitude decimal(11, 8) DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Index für schnelle PLZ-Lookup
CREATE INDEX IF NOT EXISTS idx_german_postcodes_postcode ON public.german_postcodes(postcode);
CREATE INDEX IF NOT EXISTS idx_german_postcodes_city ON public.german_postcodes(city);

-- RLS für Postcodes (Öffentlich lesbar)
ALTER TABLE public.german_postcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read postcode data" 
ON public.german_postcodes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage postcode data" 
ON public.german_postcodes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- AI-Validierung und Content-Quality Tracking (Erweiternde Funktionalität)
CREATE TABLE IF NOT EXISTS public.property_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  completeness_score integer DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  ai_optimization_score integer DEFAULT 0 CHECK (ai_optimization_score >= 0 AND ai_optimization_score <= 100),
  media_quality_score integer DEFAULT 0 CHECK (media_quality_score >= 0 AND media_quality_score <= 100),
  text_quality_score integer DEFAULT 0 CHECK (text_quality_score >= 0 AND text_quality_score <= 100),
  missing_fields jsonb DEFAULT '[]',
  optimization_suggestions jsonb DEFAULT '[]',
  last_analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS für Quality Scores
ALTER TABLE public.property_quality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies für Quality Scores
CREATE POLICY "Users can view quality scores for their properties" 
ON public.property_quality_scores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_quality_scores.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage quality scores" 
ON public.property_quality_scores 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_quality_scores.property_id 
    AND properties.user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- User Präferenzen und Nutzungsstatistiken (Erweiternde Funktionalität)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  dashboard_layout jsonb DEFAULT '{}',
  frequently_used_features jsonb DEFAULT '[]',
  last_used_features jsonb DEFAULT '[]',
  feature_usage_count jsonb DEFAULT '{}',
  ai_preferences jsonb DEFAULT '{}',
  ui_preferences jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS für User Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies für User Preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Erweiterte AI Logs für besseres Tracking (Erweiternde Funktionalität)
ALTER TABLE public.ai_generation_logs 
ADD COLUMN IF NOT EXISTS prompt_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS model_version text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS processing_time_ms integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_estimate decimal(10, 4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quality_rating integer DEFAULT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
ADD COLUMN IF NOT EXISTS feedback_data jsonb DEFAULT '{}';

-- Trigger für automatische Updated-At Timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers für alle neuen Tabellen mit updated_at
CREATE TRIGGER update_property_floorplans_updated_at
  BEFORE UPDATE ON public.property_floorplans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_quality_scores_updated_at
  BEFORE UPDATE ON public.property_quality_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Optimierte Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON public.property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_category ON public.property_media(category);
CREATE INDEX IF NOT EXISTS idx_property_media_ai_category ON public.property_media(ai_category);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_zip_code ON public.properties(zip_code);

-- Comments für Dokumentation
COMMENT ON TABLE public.property_floorplans IS 'Stores floorplan images and AI analysis data for properties';
COMMENT ON TABLE public.german_postcodes IS 'German postcode to city mapping for auto-completion';
COMMENT ON TABLE public.property_quality_scores IS 'AI-generated quality scores and optimization suggestions';
COMMENT ON TABLE public.user_preferences IS 'User dashboard preferences and feature usage tracking';