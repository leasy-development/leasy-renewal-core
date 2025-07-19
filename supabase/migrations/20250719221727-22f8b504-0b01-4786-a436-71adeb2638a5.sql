-- Create system_meta table for app version tracking
CREATE TABLE IF NOT EXISTS public.system_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_meta ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read system meta (for version checking)
CREATE POLICY "Anyone can read system meta" 
ON public.system_meta 
FOR SELECT 
USING (true);

-- Only admins can update system meta
CREATE POLICY "Admins can manage system meta" 
ON public.system_meta 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial app version
INSERT INTO public.system_meta (key, value) 
VALUES ('APP_VERSION', '2025.07.19-23:59')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();