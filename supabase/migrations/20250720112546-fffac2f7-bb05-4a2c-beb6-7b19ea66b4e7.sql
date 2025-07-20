-- Create field_mapping_suggestions table for aggregated mapping intelligence
CREATE TABLE IF NOT EXISTS public.field_mapping_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_field text NOT NULL,
  target_field text NOT NULL,
  score int NOT NULL DEFAULT 0,
  usage_count int DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now()),
  UNIQUE(source_field, target_field)
);

-- Enable RLS
ALTER TABLE public.field_mapping_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read mapping suggestions"
ON public.field_mapping_suggestions
FOR SELECT
USING (true);

-- Only system can write to suggestions (via trigger)
CREATE POLICY "System can manage suggestions"
ON public.field_mapping_suggestions
FOR ALL
USING (current_user = 'postgres' OR current_user = 'authenticator');

-- Create indexes for performance
CREATE INDEX idx_field_mapping_suggestions_source ON public.field_mapping_suggestions(source_field);
CREATE INDEX idx_field_mapping_suggestions_score ON public.field_mapping_suggestions(score DESC);

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.update_field_mapping_suggestions()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.field_mapping_suggestions (source_field, target_field, score, usage_count)
  VALUES (NEW.source_field, NEW.target_field, NEW.match_confidence, 1)
  ON CONFLICT (source_field, target_field)
  DO UPDATE SET
    score = GREATEST(field_mapping_suggestions.score, NEW.match_confidence),
    usage_count = field_mapping_suggestions.usage_count + 1,
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trg_update_suggestions
AFTER INSERT ON public.mapping_training_log
FOR EACH ROW EXECUTE FUNCTION public.update_field_mapping_suggestions();