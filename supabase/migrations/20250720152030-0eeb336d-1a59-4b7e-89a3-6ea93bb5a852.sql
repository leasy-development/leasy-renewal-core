-- Create telemetry table for tracking fallback usage
CREATE TABLE IF NOT EXISTS public.system_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_telemetry ENABLE ROW LEVEL SECURITY;

-- Create policies for telemetry
CREATE POLICY "Admins can view all telemetry" 
ON public.system_telemetry 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert telemetry" 
ON public.system_telemetry 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_telemetry_event_type ON public.system_telemetry(event_type);
CREATE INDEX IF NOT EXISTS idx_system_telemetry_created_at ON public.system_telemetry(created_at);