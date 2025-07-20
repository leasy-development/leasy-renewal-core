// Type matching the database schema for mapping_training_log table
export type MappingTrainingLog = {
  id: string;
  user_id: string | null;
  source_field: string;
  target_field: string;
  match_confidence: number;
  mapping_type: 'manual' | 'suggested' | 'auto' | 'ai';
  created_at: string;
};

// Enum for mapping types
export type MappingType = 'manual' | 'suggested' | 'auto' | 'ai';

// Interface for column mapping in the UI
export interface ColumnMapping {
  csvHeader: string;
  mappedField: string | null;
  confidence: number;
  isAutoMapped: boolean;
  isSuggestion?: boolean;
  mappingType?: MappingType;
}

// Interface for mapping suggestions loaded from database
export interface MappingSuggestion {
  field: string;
  confidence: number;
  isSuggestion?: boolean;
  mappingType?: MappingType;
}

// Database insert type for new mapping records
export type MappingTrainingLogInsert = Omit<MappingTrainingLog, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// Database update type for existing mapping records
export type MappingTrainingLogUpdate = Partial<Omit<MappingTrainingLog, 'id' | 'created_at'>>;

// Re-export for easy importing
export type { MappingTrainingLog as DatabaseMappingTrainingLog };