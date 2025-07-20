-- Create mapping training log table for smart mapping memory
CREATE TABLE IF NOT EXISTS public.mapping_training_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mapping_training_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own mapping logs"
ON public.mapping_training_log
FOR ALL
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_mapping_training_log_user_source ON public.mapping_training_log(user_id, source_field);

-- Create trigger for updated_at
CREATE TRIGGER update_mapping_training_log_updated_at
BEFORE UPDATE ON public.mapping_training_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();