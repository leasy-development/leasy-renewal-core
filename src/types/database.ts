
// Database-related type definitions
export interface DatabaseTable {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyRecord extends DatabaseTable {
  user_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  city?: string;
  country?: string;
}

export interface MediaRecord extends DatabaseTable {
  property_id: string;
  url: string;
  media_type: 'image' | 'video' | 'document';
  title?: string;
  sort_order: number;
  ai_category?: string;
  confidence_score?: number;
}

export interface UserProfile extends DatabaseTable {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  preferred_language: string;
}
