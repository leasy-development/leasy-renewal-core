-- Add missing house_rules column to properties table
ALTER TABLE public.properties
ADD COLUMN house_rules text;