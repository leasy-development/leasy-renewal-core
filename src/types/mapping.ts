export type MappingTrainingLog = {
  id: string;
  user_id: string | null;
  source_field: string;
  target_field: string;
  match_confidence: number;
  mapping_type: 'manual' | 'suggested' | 'auto' | 'ai';
  created_at: string;
};

export type MappingType = 'manual' | 'suggested' | 'auto' | 'ai';

export interface ColumnMapping {
  csvHeader: string;
  mappedField: string | null;
  confidence: number;
  isAutoMapped: boolean;
  isSuggestion?: boolean;
  mappingType?: MappingType;
}

export interface MappingSuggestion {
  field: string;
  confidence: number;
  isSuggestion?: boolean;
  mappingType?: MappingType;
}