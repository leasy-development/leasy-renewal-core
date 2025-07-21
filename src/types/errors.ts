
// Error handling type definitions
export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface NetworkError extends AppError {
  status?: number;
  url?: string;
  method?: string;
}

export interface DatabaseError extends AppError {
  query?: string;
  table?: string;
}
