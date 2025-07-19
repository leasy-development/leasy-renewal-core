-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for property photos
CREATE POLICY "Property photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-photos');

CREATE POLICY "Users can upload their own property photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own property photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own property photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-photos' AND auth.uid() IS NOT NULL);