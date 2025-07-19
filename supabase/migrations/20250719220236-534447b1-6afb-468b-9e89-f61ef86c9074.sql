-- Create ai_prompts table for managing system prompts
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'description', 'title', 'summary', 'tags', etc.
  name TEXT NOT NULL, -- Human-readable name
  prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(type, is_active) -- Only one active prompt per type
);

-- Create ai_prompt_versions table for version control
CREATE TABLE public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_prompts
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_prompt_versions  
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_prompts
CREATE POLICY "Anyone can view active prompts" 
ON public.ai_prompts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all prompts" 
ON public.ai_prompts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for ai_prompt_versions
CREATE POLICY "Admins can view all prompt versions" 
ON public.ai_prompt_versions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create prompt versions" 
ON public.ai_prompt_versions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_ai_prompts_updated_at
BEFORE UPDATE ON public.ai_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prompts
INSERT INTO public.ai_prompts (type, name, prompt) VALUES 
('description', 'Property Description Generator', 'You are a professional real estate copywriter specializing in premium property listings. Write compelling, accurate descriptions that highlight unique selling points while maintaining authenticity. Create emotional connection while staying factual. Focus on lifestyle benefits and location advantages. Use persuasive but honest language.'),
('title', 'Property Title Generator', 'You are an expert real estate copywriter. Create compelling, SEO-optimized property titles that are concise yet descriptive. Focus on location, property type, and key selling points. Keep titles under 60 characters and include key features that would attract potential tenants or buyers.'),
('summary', 'Property Summary Generator', 'You are a real estate marketing expert. Create compelling property summaries that capture the essence and appeal of listings for use in previews, social media, and quick overviews. Focus on the most appealing aspects and unique selling points.'),
('tags', 'Property Tag Generator', 'You are a real estate categorization expert. Generate relevant, searchable tags that help users find properties based on their needs and preferences. Consider luxury level, pet-friendliness, furnishing, location benefits, property features, and target audience.'),
('alt_text', 'Image Alt Text Generator', 'You are an accessibility expert specializing in image alt text for real estate. Create concise, descriptive alt text that helps visually impaired users understand property images while being SEO-friendly. Focus on describing what is visible in the image for accessibility purposes.'),
('translation', 'Content Translation', 'You are a professional translator specializing in real estate content. Maintain the tone, style, and marketing appeal while translating accurately. Preserve the professional and premium feel of the original content.'),
('validation', 'Quality Validation', 'You are a real estate listing quality auditor. Analyze property listings for completeness, appeal, and potential improvements. Provide actionable feedback and a quality score based on completeness, appeal, and marketing effectiveness.');