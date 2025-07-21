export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_generation_logs: {
        Row: {
          character_count: number | null
          created_at: string
          format: string | null
          id: string
          language: string | null
          property_title: string | null
          tone: string | null
          user_id: string | null
        }
        Insert: {
          character_count?: number | null
          created_at?: string
          format?: string | null
          id?: string
          language?: string | null
          property_title?: string | null
          tone?: string | null
          user_id?: string | null
        }
        Update: {
          character_count?: number | null
          created_at?: string
          format?: string | null
          id?: string
          language?: string | null
          property_title?: string | null
          tone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_generation_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          priority: number | null
          property_id: string | null
          result: Json | null
          status: string | null
          target_language: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          property_id?: string | null
          result?: Json | null
          status?: string | null
          target_language?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          property_id?: string | null
          result?: Json | null
          status?: string | null
          target_language?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_queue_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_versions: {
        Row: {
          accuracy_score: number | null
          created_at: string
          deployment_date: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          model_type: string
          precision_score: number | null
          recall_score: number | null
          training_samples_count: number | null
          version_name: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          deployment_date?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_type?: string
          precision_score?: number | null
          recall_score?: number | null
          training_samples_count?: number | null
          version_name: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          deployment_date?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_type?: string
          precision_score?: number | null
          recall_score?: number | null
          training_samples_count?: number | null
          version_name?: string
        }
        Relationships: []
      }
      ai_prompt_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          prompt: string
          prompt_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          prompt: string
          prompt_id: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          prompt?: string
          prompt_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          prompt: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          prompt: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          prompt?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_versions: {
        Row: {
          ai_generated: boolean | null
          content: string
          created_at: string | null
          created_by: string | null
          field_name: string
          id: string
          prompt_version: string | null
          property_id: string | null
          quality_score: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          created_at?: string | null
          created_by?: string | null
          field_name: string
          id?: string
          prompt_version?: string | null
          property_id?: string | null
          quality_score?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          field_name?: string
          id?: string
          prompt_version?: string | null
          property_id?: string | null
          quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_versions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_feedback: {
        Row: {
          confidence_before: number | null
          corrected_category: Database["public"]["Enums"]["image_category"]
          created_at: string
          feedback_type: string | null
          id: string
          image_categorization_id: string | null
          original_prediction:
            | Database["public"]["Enums"]["image_category"]
            | null
          user_id: string
        }
        Insert: {
          confidence_before?: number | null
          corrected_category: Database["public"]["Enums"]["image_category"]
          created_at?: string
          feedback_type?: string | null
          id?: string
          image_categorization_id?: string | null
          original_prediction?:
            | Database["public"]["Enums"]["image_category"]
            | null
          user_id: string
        }
        Update: {
          confidence_before?: number | null
          corrected_category?: Database["public"]["Enums"]["image_category"]
          created_at?: string
          feedback_type?: string | null
          id?: string
          image_categorization_id?: string | null
          original_prediction?:
            | Database["public"]["Enums"]["image_category"]
            | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorization_feedback_image_categorization_id_fkey"
            columns: ["image_categorization_id"]
            isOneToOne: false
            referencedRelation: "image_categorization"
            referencedColumns: ["id"]
          },
        ]
      }
      city_districts: {
        Row: {
          city: string
          created_at: string
          district: string
          id: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          district: string
          id?: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          district?: string
          id?: string
          zip_code?: string
        }
        Relationships: []
      }
      code_fix_log: {
        Row: {
          created_at: string
          deepsource_issue_id: string | null
          error_details: string | null
          file_path: string
          fix_method: string | null
          fix_summary: string | null
          id: string
          issue_code: string
          line_number: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deepsource_issue_id?: string | null
          error_details?: string | null
          file_path: string
          fix_method?: string | null
          fix_summary?: string | null
          id?: string
          issue_code: string
          line_number?: number | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deepsource_issue_id?: string | null
          error_details?: string | null
          file_path?: string
          fix_method?: string | null
          fix_summary?: string | null
          id?: string
          issue_code?: string
          line_number?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          config: Json
          created_at: string
          id: string
          position: Json
          size: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          position?: Json
          size?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          position?: Json
          size?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deepsource_issues: {
        Row: {
          category: string
          check_id: string
          created_at: string
          deepsource_issue_id: string
          description: string | null
          file_count: number | null
          file_path: string
          first_seen_at: string | null
          fix_applied_at: string | null
          fix_method: string | null
          fix_summary: string | null
          id: string
          is_autofixable: boolean | null
          last_seen_at: string | null
          line_begin: number | null
          line_end: number | null
          occurrence_count: number | null
          raw_issue_data: Json | null
          repository_id: string
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          check_id: string
          created_at?: string
          deepsource_issue_id: string
          description?: string | null
          file_count?: number | null
          file_path: string
          first_seen_at?: string | null
          fix_applied_at?: string | null
          fix_method?: string | null
          fix_summary?: string | null
          id?: string
          is_autofixable?: boolean | null
          last_seen_at?: string | null
          line_begin?: number | null
          line_end?: number | null
          occurrence_count?: number | null
          raw_issue_data?: Json | null
          repository_id: string
          severity: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          check_id?: string
          created_at?: string
          deepsource_issue_id?: string
          description?: string | null
          file_count?: number | null
          file_path?: string
          first_seen_at?: string | null
          fix_applied_at?: string | null
          fix_method?: string | null
          fix_summary?: string | null
          id?: string
          is_autofixable?: boolean | null
          last_seen_at?: string | null
          line_begin?: number | null
          line_end?: number | null
          occurrence_count?: number | null
          raw_issue_data?: Json | null
          repository_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deepsource_issues_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "deepsource_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      deepsource_repositories: {
        Row: {
          api_token_configured: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          organization_slug: string
          repository_name: string
          repository_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_token_configured?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_slug: string
          repository_name: string
          repository_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_token_configured?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_slug?: string
          repository_name?: string
          repository_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deepsource_scans: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          issues_fixed: number | null
          issues_found: number | null
          issues_new: number | null
          issues_resolved: number | null
          repository_id: string
          scan_duration_ms: number | null
          scan_metadata: Json | null
          scan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          issues_fixed?: number | null
          issues_found?: number | null
          issues_new?: number | null
          issues_resolved?: number | null
          repository_id: string
          scan_duration_ms?: number | null
          scan_metadata?: Json | null
          scan_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          issues_fixed?: number | null
          issues_found?: number | null
          issues_new?: number | null
          issues_resolved?: number | null
          repository_id?: string
          scan_duration_ms?: number | null
          scan_metadata?: Json | null
          scan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deepsource_scans_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "deepsource_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_detection_log: {
        Row: {
          action_type: string
          admin_user_id: string
          affected_properties: string[]
          created_at: string
          details: Json
          duplicate_group_id: string | null
          id: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          affected_properties?: string[]
          created_at?: string
          details?: Json
          duplicate_group_id?: string | null
          id?: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          affected_properties?: string[]
          created_at?: string
          details?: Json
          duplicate_group_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_detection_log_duplicate_group_id_fkey"
            columns: ["duplicate_group_id"]
            isOneToOne: false
            referencedRelation: "global_duplicate_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_detection_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      duplicate_false_positives: {
        Row: {
          admin_user_id: string
          created_at: string | null
          id: string
          property_id_1: string
          property_id_2: string
          reason: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          id?: string
          property_id_1: string
          property_id_2: string
          reason?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          id?: string
          property_id_1?: string
          property_id_2?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_false_positives_property_id_1_fkey"
            columns: ["property_id_1"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_false_positives_property_id_2_fkey"
            columns: ["property_id_2"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          id: string
          message: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      field_mapping_memory: {
        Row: {
          confidence_score: number
          created_at: string
          document_field_name: string
          document_field_pattern: string
          id: string
          mapped_field_key: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          document_field_name: string
          document_field_pattern: string
          id?: string
          mapped_field_key: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          document_field_name?: string
          document_field_pattern?: string
          id?: string
          mapped_field_key?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      field_mapping_suggestions: {
        Row: {
          created_at: string | null
          id: string
          score: number
          source_field: string
          target_field: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          score?: number
          source_field: string
          target_field: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          score?: number
          source_field?: string
          target_field?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      floorplan_analysis: {
        Row: {
          analysis_version: string | null
          confidence_score: number | null
          created_at: string
          dimensions_data: Json | null
          extracted_text: string | null
          floorplan_url: string
          id: string
          property_id: string | null
          room_data: Json | null
        }
        Insert: {
          analysis_version?: string | null
          confidence_score?: number | null
          created_at?: string
          dimensions_data?: Json | null
          extracted_text?: string | null
          floorplan_url: string
          id?: string
          property_id?: string | null
          room_data?: Json | null
        }
        Update: {
          analysis_version?: string | null
          confidence_score?: number | null
          created_at?: string
          dimensions_data?: Json | null
          extracted_text?: string | null
          floorplan_url?: string
          id?: string
          property_id?: string | null
          room_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "floorplan_analysis_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      floorplan_files: {
        Row: {
          created_at: string
          file_url: string
          id: string
          parsed_dimensions: Json | null
          parsed_rooms: Json | null
          property_id: string | null
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          parsed_dimensions?: Json | null
          parsed_rooms?: Json | null
          property_id?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          parsed_dimensions?: Json | null
          parsed_rooms?: Json | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floorplan_files_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      global_duplicate_groups: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          merge_target_property_id: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          merge_target_property_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          merge_target_property_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_duplicate_groups_merge_target_property_id_fkey"
            columns: ["merge_target_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      global_duplicate_properties: {
        Row: {
          created_at: string
          duplicate_group_id: string
          id: string
          property_id: string
          similarity_reasons: Json
        }
        Insert: {
          created_at?: string
          duplicate_group_id: string
          id?: string
          property_id: string
          similarity_reasons?: Json
        }
        Update: {
          created_at?: string
          duplicate_group_id?: string
          id?: string
          property_id?: string
          similarity_reasons?: Json
        }
        Relationships: [
          {
            foreignKeyName: "global_duplicate_properties_duplicate_group_id_fkey"
            columns: ["duplicate_group_id"]
            isOneToOne: false
            referencedRelation: "global_duplicate_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_duplicate_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      image_audit_trail: {
        Row: {
          created_at: string
          health_check_results: Json | null
          id: string
          image_url: string
          metadata: Json | null
          original_filename: string | null
          property_id: string | null
          source_type: Database["public"]["Enums"]["image_source"]
          source_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          health_check_results?: Json | null
          id?: string
          image_url: string
          metadata?: Json | null
          original_filename?: string | null
          property_id?: string | null
          source_type: Database["public"]["Enums"]["image_source"]
          source_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          health_check_results?: Json | null
          id?: string
          image_url?: string
          metadata?: Json | null
          original_filename?: string | null
          property_id?: string | null
          source_type?: Database["public"]["Enums"]["image_source"]
          source_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_audit_trail_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      image_categorization: {
        Row: {
          confidence_score: number | null
          created_at: string
          final_category: Database["public"]["Enums"]["image_category"] | null
          id: string
          image_url: string
          is_auto_assigned: boolean | null
          model_version: string | null
          predicted_category:
            | Database["public"]["Enums"]["image_category"]
            | null
          property_id: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          final_category?: Database["public"]["Enums"]["image_category"] | null
          id?: string
          image_url: string
          is_auto_assigned?: boolean | null
          model_version?: string | null
          predicted_category?:
            | Database["public"]["Enums"]["image_category"]
            | null
          property_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          final_category?: Database["public"]["Enums"]["image_category"] | null
          id?: string
          image_url?: string
          is_auto_assigned?: boolean | null
          model_version?: string | null
          predicted_category?:
            | Database["public"]["Enums"]["image_category"]
            | null
          property_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_categorization_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      image_hashes: {
        Row: {
          created_at: string
          file_size: number | null
          hash_type: string
          hash_value: string
          height: number | null
          id: string
          image_url: string
          property_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          hash_type?: string
          hash_value: string
          height?: number | null
          id?: string
          image_url: string
          property_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          hash_type?: string
          hash_value?: string
          height?: number | null
          id?: string
          image_url?: string
          property_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_hashes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_training_log: {
        Row: {
          created_at: string | null
          id: string
          mapping_type: string | null
          match_confidence: number | null
          source_field: string
          target_field: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mapping_type?: string | null
          match_confidence?: number | null
          source_field: string
          target_field: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mapping_type?: string | null
          match_confidence?: number | null
          source_field?: string
          target_field?: string
          user_id?: string | null
        }
        Relationships: []
      }
      media_category_feedback_log: {
        Row: {
          corrected_by: string
          corrected_category: string
          created_at: string
          id: string
          image_hash: string | null
          original_prediction: string | null
        }
        Insert: {
          corrected_by: string
          corrected_category: string
          created_at?: string
          id?: string
          image_hash?: string | null
          original_prediction?: string | null
        }
        Update: {
          corrected_by?: string
          corrected_category?: string
          created_at?: string
          id?: string
          image_hash?: string | null
          original_prediction?: string | null
        }
        Relationships: []
      }
      merged_properties_tracking: {
        Row: {
          fingerprint: string
          id: string
          merge_date: string
          merge_reason: string | null
          merged_by: string
          original_data: Json
          original_property_id: string
          target_property_id: string
        }
        Insert: {
          fingerprint: string
          id?: string
          merge_date?: string
          merge_reason?: string | null
          merged_by: string
          original_data: Json
          original_property_id: string
          target_property_id: string
        }
        Update: {
          fingerprint?: string
          id?: string
          merge_date?: string
          merge_reason?: string | null
          merged_by?: string
          original_data?: Json
          original_property_id?: string
          target_property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merged_properties_tracking_target_property_id_fkey"
            columns: ["target_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          ai_optimized: boolean | null
          ai_ready: boolean | null
          apartment_type: string | null
          bathrooms: number | null
          bedrooms: number | null
          category: string | null
          checkin_time: string | null
          checkout_time: string | null
          city: string | null
          content_quality_score: number | null
          contractual_partner: Json | null
          country: string | null
          created_at: string
          daily_rate: number | null
          description: string | null
          description_de: string | null
          description_en: string | null
          embedding_vector: string | null
          house_rules: string | null
          id: string
          landlord_info: Json | null
          language_detected: string | null
          listing_segment: string | null
          max_guests: number | null
          meta_description_de: string | null
          meta_description_en: string | null
          monthly_rent: number | null
          provides_wgsb: boolean | null
          region: string | null
          square_meters: number | null
          status: string | null
          street_name: string | null
          street_number: string | null
          title: string
          title_de: string | null
          title_en: string | null
          total_rooms: number | null
          translation_verified: boolean | null
          updated_at: string
          user_id: string
          weekly_rate: number | null
          zip_code: string | null
        }
        Insert: {
          ai_optimized?: boolean | null
          ai_ready?: boolean | null
          apartment_type?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          category?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          city?: string | null
          content_quality_score?: number | null
          contractual_partner?: Json | null
          country?: string | null
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          embedding_vector?: string | null
          house_rules?: string | null
          id?: string
          landlord_info?: Json | null
          language_detected?: string | null
          listing_segment?: string | null
          max_guests?: number | null
          meta_description_de?: string | null
          meta_description_en?: string | null
          monthly_rent?: number | null
          provides_wgsb?: boolean | null
          region?: string | null
          square_meters?: number | null
          status?: string | null
          street_name?: string | null
          street_number?: string | null
          title: string
          title_de?: string | null
          title_en?: string | null
          total_rooms?: number | null
          translation_verified?: boolean | null
          updated_at?: string
          user_id: string
          weekly_rate?: number | null
          zip_code?: string | null
        }
        Update: {
          ai_optimized?: boolean | null
          ai_ready?: boolean | null
          apartment_type?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          category?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          city?: string | null
          content_quality_score?: number | null
          contractual_partner?: Json | null
          country?: string | null
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          embedding_vector?: string | null
          house_rules?: string | null
          id?: string
          landlord_info?: Json | null
          language_detected?: string | null
          listing_segment?: string | null
          max_guests?: number | null
          meta_description_de?: string | null
          meta_description_en?: string | null
          monthly_rent?: number | null
          provides_wgsb?: boolean | null
          region?: string | null
          square_meters?: number | null
          status?: string | null
          street_name?: string | null
          street_number?: string | null
          title?: string
          title_de?: string | null
          title_en?: string | null
          total_rooms?: number | null
          translation_verified?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_rate?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      property_fees: {
        Row: {
          amount: number
          created_at: string
          frequency: string
          id: string
          name: string
          property_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          frequency: string
          id?: string
          name: string
          property_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          frequency?: string
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_fees_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_media: {
        Row: {
          ai_category: Database["public"]["Enums"]["image_category"] | null
          category: string | null
          confidence_score: number | null
          created_at: string
          id: string
          media_type: string
          property_id: string
          sort_order: number | null
          title: string | null
          url: string
        }
        Insert: {
          ai_category?: Database["public"]["Enums"]["image_category"] | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          media_type: string
          property_id: string
          sort_order?: number | null
          title?: string | null
          url: string
        }
        Update: {
          ai_category?: Database["public"]["Enums"]["image_category"] | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          media_type?: string
          property_id?: string
          sort_order?: number | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_media_hashes: {
        Row: {
          created_at: string | null
          hash_type: string
          hash_value: string
          id: string
          media_url: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          hash_type?: string
          hash_value: string
          id?: string
          media_url: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          hash_type?: string
          hash_value?: string
          id?: string
          media_url?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_media_hashes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_sync_status: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_synced: string | null
          platform: string
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced?: string | null
          platform: string
          property_id: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced?: string | null
          platform?: string
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_sync_status_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      system_meta: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      system_telemetry: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_submissions: {
        Row: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          listings_count: string
          source: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          listings_count: string
          source?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          listings_count?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      deepsource_issue_stats: {
        Row: {
          category: string | null
          issue_count: number | null
          severity: string | null
          status: string | null
          total_files_affected: number | null
          total_occurrences: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      changepassword: {
        Args: {
          current_plain_password: string
          new_plain_password: string
          current_id: string
        }
        Returns: string
      }
      check_potential_duplicate: {
        Args: {
          p_title: string
          p_street_name: string
          p_street_number: string
          p_city: string
          p_zip_code: string
          p_monthly_rent: number
          p_bedrooms: number
          p_square_meters: number
          similarity_threshold?: number
        }
        Returns: {
          property_id: string
          similarity_score: number
          match_reasons: string[]
        }[]
      }
      create_duplicate_group: {
        Args: {
          p_confidence_score: number
          p_property_ids: string[]
          p_similarity_reasons: Json[]
        }
        Returns: string
      }
      generate_property_fingerprint: {
        Args: {
          p_title: string
          p_street_name: string
          p_street_number: string
          p_zip_code: string
          p_city: string
          p_monthly_rent: number
          p_bedrooms: number
          p_square_meters: number
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_duplicate_detection_stats: {
        Args: { admin_user_id: string }
        Returns: {
          total_groups: number
          pending_groups: number
          resolved_groups: number
          dismissed_groups: number
          high_confidence_groups: number
          recent_scans: number
          last_scan_date: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      image_category:
        | "main_bedroom"
        | "second_bedroom"
        | "third_bedroom"
        | "main_bathroom"
        | "second_bathroom"
        | "kitchen"
        | "living_room"
        | "dining_room"
        | "balcony"
        | "terrace"
        | "outside"
        | "entrance"
        | "hallway"
        | "storage"
        | "other"
      image_source: "manual_upload" | "bulk_import" | "scraper" | "ai_generated"
      media_source: "manual_upload" | "bulk_import" | "scraper"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      image_category: [
        "main_bedroom",
        "second_bedroom",
        "third_bedroom",
        "main_bathroom",
        "second_bathroom",
        "kitchen",
        "living_room",
        "dining_room",
        "balcony",
        "terrace",
        "outside",
        "entrance",
        "hallway",
        "storage",
        "other",
      ],
      image_source: ["manual_upload", "bulk_import", "scraper", "ai_generated"],
      media_source: ["manual_upload", "bulk_import", "scraper"],
    },
  },
} as const
