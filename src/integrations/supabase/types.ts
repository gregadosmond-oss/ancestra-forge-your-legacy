export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      book_orders: {
        Row: {
          created_at: string | null
          format: string
          gelato_order_id: string | null
          gelato_order_reference: string | null
          id: string
          page_count: number | null
          pdf_url: string | null
          shipping_address: Json | null
          status: string | null
          surname: string | null
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          format: string
          gelato_order_id?: string | null
          gelato_order_reference?: string | null
          id?: string
          page_count?: number | null
          pdf_url?: string | null
          shipping_address?: Json | null
          status?: string | null
          surname?: string | null
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          format?: string
          gelato_order_id?: string | null
          gelato_order_reference?: string | null
          id?: string
          page_count?: number | null
          pdf_url?: string | null
          shipping_address?: Json | null
          status?: string | null
          surname?: string | null
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      book_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          surname: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
          surname?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          surname?: string | null
        }
        Relationships: []
      }
      crests: {
        Row: {
          created_at: string
          crest_url: string | null
          id: string
          motto_english: string | null
          motto_latin: string | null
          prompt_used: string | null
          surname: string
          user_id: string | null
          variables_json: Json | null
        }
        Insert: {
          created_at?: string
          crest_url?: string | null
          id?: string
          motto_english?: string | null
          motto_latin?: string | null
          prompt_used?: string | null
          surname: string
          user_id?: string | null
          variables_json?: Json | null
        }
        Update: {
          created_at?: string
          crest_url?: string | null
          id?: string
          motto_english?: string | null
          motto_latin?: string | null
          prompt_used?: string | null
          surname?: string
          user_id?: string | null
          variables_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_legacy_chapters: {
        Row: {
          body: string
          chapter_num: number
          created_at: string | null
          id: string
          surname: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          chapter_num: number
          created_at?: string | null
          id?: string
          surname: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          chapter_num?: number
          created_at?: string | null
          id?: string
          surname?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deep_legacy_results: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          interview_answers: Json | null
          research_summary: string | null
          sources: Json | null
          surname: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          interview_answers?: Json | null
          research_summary?: string | null
          sources?: Json | null
          surname: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          interview_answers?: Json | null
          research_summary?: string | null
          sources?: Json | null
          surname?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          cache_hit: boolean
          call_type: string
          created_at: string
          duration_ms: number
          error_reason: string | null
          id: string
          model_version: string
          success: boolean
          surname: string
        }
        Insert: {
          cache_hit: boolean
          call_type: string
          created_at?: string
          duration_ms: number
          error_reason?: string | null
          id?: string
          model_version: string
          success: boolean
          surname: string
        }
        Update: {
          cache_hit?: boolean
          call_type?: string
          created_at?: string
          duration_ms?: number
          error_reason?: string | null
          id?: string
          model_version?: string
          success?: boolean
          surname?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          created_at: string
          id: string
          personal_message: string | null
          recipient_email: string | null
          recipient_name: string | null
          sender_name: string | null
          status: string
          surname: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          personal_message?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_name?: string | null
          status?: string
          surname: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          personal_message?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_name?: string | null
          status?: string
          surname?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      journey_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          surname_searched: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
          surname_searched?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          surname_searched?: string | null
        }
        Relationships: []
      }
      legacy_book_orders: {
        Row: {
          amount_total: number | null
          buyer_email: string
          cover_pdf_url: string | null
          created_at: string
          currency: string | null
          display_surname: string
          fulfillment_error: string | null
          fulfillment_status: string
          gelato_item_reference_id: string | null
          gelato_order_id: string | null
          gelato_order_reference_id: string | null
          id: string
          interior_pdf_url: string | null
          notes: string | null
          shipping_address: Json
          stripe_payment_intent: string | null
          stripe_session_id: string
          surname: string
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          buyer_email: string
          cover_pdf_url?: string | null
          created_at?: string
          currency?: string | null
          display_surname: string
          fulfillment_error?: string | null
          fulfillment_status?: string
          gelato_item_reference_id?: string | null
          gelato_order_id?: string | null
          gelato_order_reference_id?: string | null
          id?: string
          interior_pdf_url?: string | null
          notes?: string | null
          shipping_address: Json
          stripe_payment_intent?: string | null
          stripe_session_id: string
          surname: string
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          buyer_email?: string
          cover_pdf_url?: string | null
          created_at?: string
          currency?: string | null
          display_surname?: string
          fulfillment_error?: string | null
          fulfillment_status?: string
          gelato_item_reference_id?: string | null
          gelato_order_id?: string | null
          gelato_order_reference_id?: string | null
          id?: string
          interior_pdf_url?: string | null
          notes?: string | null
          shipping_address?: Json
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          surname?: string
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_year: number | null
          country_of_origin: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          surname: string | null
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          country_of_origin?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          surname?: string | null
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          country_of_origin?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          surname?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_total: number | null
          created_at: string | null
          currency: string | null
          email_sent: boolean
          environment: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          created_at?: string | null
          currency?: string | null
          email_sent?: boolean
          environment?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          created_at?: string | null
          currency?: string | null
          email_sent?: boolean
          environment?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      surname_crests: {
        Row: {
          created_at: string
          image_url: string
          prompt: string
          surname: string
        }
        Insert: {
          created_at?: string
          image_url: string
          prompt: string
          surname: string
        }
        Update: {
          created_at?: string
          image_url?: string
          prompt?: string
          surname?: string
        }
        Relationships: []
      }
      surname_facts: {
        Row: {
          created_at: string
          model_version: string
          payload: Json
          story_payload: Json | null
          surname: string
        }
        Insert: {
          created_at?: string
          model_version: string
          payload: Json
          story_payload?: Json | null
          surname: string
        }
        Update: {
          created_at?: string
          model_version?: string
          payload?: Json
          story_payload?: Json | null
          surname?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
