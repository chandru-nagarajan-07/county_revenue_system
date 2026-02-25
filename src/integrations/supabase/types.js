const Json = null; // Placeholder - use any valid JSON value in practice

const Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient(Database, { PostgrestVersion: 'XX' })(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  },
  public: {
    Tables: {
      api_configs: {
        Row: {
          code_template: "",
          created_at: "",
          headers: Json,
          id: "",
          method: "",
          name: "",
          request_mappings: Json,
          response_mappings: Json,
          service_id: "",
          tested: false,
          updated_at: ""
        },
        Insert: {
          code_template: Json, // optional in TS becomes undefined/null in JS
          created_at: Json,
          headers: Json,
          id: Json,
          method: Json,
          name: "",
          request_mappings: Json,
          response_mappings: Json,
          service_id: "",
          tested: Json,
          updated_at: Json
        },
        Update: {
          code_template: Json,
          created_at: Json,
          headers: Json,
          id: "",
          method: "",
          name: Json,
          request_mappings: Json,
          response_mappings: Json,
          service_id: Json,
          tested: Json,
          updated_at: Json
        },
        Relationships: []
      },
      change_requests: {
        Row: {
          change_type: null, // "draft" | "submitted" | etc.
          config_snapshot: Json,
          created_at: "",
          description: "",
          id: "",
          review_notes: null,
          reviewed_by: null,
          service_id: "",
          status: null, // "draft" | "submitted" | etc.
          submitted_by: "",
          test_results: Json,
          title: "",
          updated_at: ""
        },
        Insert: {
          change_type: null,
          config_snapshot: Json,
          created_at: Json,
          description: Json,
          id: Json,
          review_notes: Json,
          reviewed_by: Json,
          service_id: "",
          status: Json,
          submitted_by: Json,
          test_results: Json,
          title: "",
          updated_at: Json
        },
        Update: {
          change_type: Json,
          config_snapshot: Json,
          created_at: Json,
          description: Json,
          id: "",
          review_notes: Json,
          reviewed_by: Json,
          service_id: Json,
          status: null,
          submitted_by: "",
          test_results: Json,
          title: Json,
          updated_at: Json
        },
        Relationships: []
      },
      customer_segments: {
        Row: {
          created_at: "",
          id: "",
          label: "",
          segment_key: "",
          sort_order: 0
        },
        Insert: {
          created_at: Json,
          id: Json,
          label: "",
          segment_key: "",
          sort_order: Json
        },
        Update: {
          created_at: Json,
          id: "",
          label: Json,
          segment_key: Json,
          sort_order: 0
        },
        Relationships: []
      },
      pricing_configs: {
        Row: {
          created_at: "",
          id: "",
          max_charge: 0,
          min_charge: 0,
          percentage_fee: 0,
          segment_key: "",
          service_fee: 0,
          service_id: "",
          updated_at: ""
        },
        Insert: {
          created_at: Json,
          id: Json,
          max_charge: Json,
          min_charge: Json,
          percentage_fee: Json,
          segment_key: "",
          service_fee: Json,
          service_id: "",
          updated_at: Json
        },
        Update: {
          created_at: Json,
          id: "",
          max_charge: Json,
          min_charge: Json,
          percentage_fee: 0,
          segment_key: Json,
          service_fee: 0,
          service_id: Json,
          updated_at: Json
        },
        Relationships: [
          {
            foreignKeyName: "pricing_configs_segment_key_fkey",
            columns: ["segment_key"],
            isOneToOne: false,
            referencedRelation: "customer_segments",
            referencedColumns: ["segment_key"]
          }
        ]
      },
      published_versions: {
        Row: {
          change_request_id: null,
          change_type: null, // "workflow" | "api"
          config_snapshot: Json,
          created_at: "",
          id: "",
          is_active: false,
          published_by: "",
          service_id: "",
          version_number: 0
        },
        Insert: {
          change_request_id: Json,
          change_type: null,
          config_snapshot: Json,
          created_at: Json,
          id: Json,
          is_active: Json,
          published_by: Json,
          service_id: "",
          version_number: 0
        },
        Update: {
          change_request_id: Json,
          change_type: Json,
          config_snapshot: Json,
          created_at: "",
          id: "",
          is_active: false,
          published_by: "",
          service_id: Json,
          version_number: Json
        },
        Relationships: [
          {
            foreignKeyName: "published_versions_change_request_id_fkey",
            columns: ["change_request_id"],
            isOneToOne: false,
            referencedRelation: "change_requests",
            referencedColumns: ["id"]
          }
        ]
      },
      workflow_configs: {
        Row: {
          charge_override: null,
          created_at: "",
          id: "",
          service_id: "",
          service_title: "",
          stages: Json,
          updated_at: ""
        },
        Insert: {
          charge_override: Json,
          created_at: Json,
          id: Json,
          service_id: "",
          service_title: "",
          stages: Json,
          updated_at: Json
        },
        Update: {
          charge_override: Json,
          created_at: "",
          id: "",
          service_id: Json,
          service_title: Json,
          stages: Json,
          updated_at: ""
        },
        Relationships: []
      }
    },
    Views: {},
    Functions: {},
    Enums: {
      change_status: null, // Use: "draft", "submitted", "in_review", "testing", "approved", "rejected", "published"
      change_type: null // Use: "workflow", "api"
    },
    CompositeTypes: {}
  }
};
