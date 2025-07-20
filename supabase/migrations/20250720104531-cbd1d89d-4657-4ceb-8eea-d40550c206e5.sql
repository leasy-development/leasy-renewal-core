-- Add total_rooms field to properties table
ALTER TABLE public.properties 
ADD COLUMN total_rooms integer;

-- Create field mapping memory table for self-learning system
CREATE TABLE public.field_mapping_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_field_name TEXT NOT NULL,
  document_field_pattern TEXT NOT NULL, -- For pattern matching
  mapped_field_key TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 1.0,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create city district lookup table
CREATE TABLE public.city_districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for field_mapping_memory
ALTER TABLE public.field_mapping_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own field mappings"
ON public.field_mapping_memory
FOR ALL
USING (auth.uid() = user_id);

-- Add RLS policies for city_districts (read-only for all users)
ALTER TABLE public.city_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read city districts"
ON public.city_districts
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage city districts"
ON public.city_districts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for better performance
CREATE INDEX idx_field_mapping_memory_user_pattern ON public.field_mapping_memory(user_id, document_field_pattern);
CREATE INDEX idx_city_districts_lookup ON public.city_districts(city, zip_code);

-- Create updated_at trigger for field_mapping_memory
CREATE TRIGGER update_field_mapping_memory_updated_at
  BEFORE UPDATE ON public.field_mapping_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample German city districts for testing
INSERT INTO public.city_districts (city, zip_code, district) VALUES
('Berlin', '10115', 'Mitte'),
('Berlin', '10117', 'Mitte'),
('Berlin', '10119', 'Mitte'),
('Berlin', '10178', 'Mitte'),
('Berlin', '10179', 'Mitte'),
('Berlin', '10435', 'Prenzlauer Berg'),
('Berlin', '10437', 'Prenzlauer Berg'),
('Berlin', '10439', 'Prenzlauer Berg'),
('Hamburg', '20095', 'Hamburg-Altstadt'),
('Hamburg', '20097', 'Hamburg-Altstadt'),
('Hamburg', '22087', 'Hohenfelde'),
('München', '80331', 'Altstadt-Lehel'),
('München', '80333', 'Altstadt-Lehel'),
('München', '80335', 'Maxvorstadt'),
('Köln', '50667', 'Innenstadt'),
('Köln', '50668', 'Innenstadt'),
('Köln', '50670', 'Innenstadt'),
('Frankfurt am Main', '60311', 'Innenstadt'),
('Frankfurt am Main', '60313', 'Innenstadt'),
('Frankfurt am Main', '60316', 'Nordend');

-- Update category enum to standardize values
-- Note: We'll handle category validation in the application layer since
-- PostgreSQL enum changes require careful handling