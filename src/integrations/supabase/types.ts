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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          contact_submission_id: string | null
          created_at: string
          id: string
          live_agent_requested: boolean
          updated_at: string
          visitor_token: string
        }
        Insert: {
          contact_submission_id?: string | null
          created_at?: string
          id?: string
          live_agent_requested?: boolean
          updated_at?: string
          visitor_token: string
        }
        Update: {
          contact_submission_id?: string | null
          created_at?: string
          id?: string
          live_agent_requested?: boolean
          updated_at?: string
          visitor_token?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          clinical_system: string | null
          contact_preference: string | null
          created_at: string
          email: string
          heard_about: string | null
          id: string
          interests: string[] | null
          job_role: string | null
          list_size: string | null
          message: string
          name: string
          organisation_type: string | null
          phone: string | null
          practice: string | null
          status: string
          timeline: string | null
        }
        Insert: {
          clinical_system?: string | null
          contact_preference?: string | null
          created_at?: string
          email: string
          heard_about?: string | null
          id?: string
          interests?: string[] | null
          job_role?: string | null
          list_size?: string | null
          message: string
          name: string
          organisation_type?: string | null
          phone?: string | null
          practice?: string | null
          status?: string
          timeline?: string | null
        }
        Update: {
          clinical_system?: string | null
          contact_preference?: string | null
          created_at?: string
          email?: string
          heard_about?: string | null
          id?: string
          interests?: string[] | null
          job_role?: string | null
          list_size?: string | null
          message?: string
          name?: string
          organisation_type?: string | null
          phone?: string | null
          practice?: string | null
          status?: string
          timeline?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      mail_attachments: {
        Row: {
          content_type: string
          created_at: string
          filename: string
          id: string
          message_id: string
          provider_attachment_id: string | null
          size: number
          storage_path: string | null
        }
        Insert: {
          content_type?: string
          created_at?: string
          filename?: string
          id?: string
          message_id: string
          provider_attachment_id?: string | null
          size?: number
          storage_path?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          filename?: string
          id?: string
          message_id?: string
          provider_attachment_id?: string | null
          size?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "mail_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_events: {
        Row: {
          detail: string | null
          id: string
          message_id: string | null
          occurred_at: string
          provider_event_id: string | null
          type: string
        }
        Insert: {
          detail?: string | null
          id?: string
          message_id?: string | null
          occurred_at?: string
          provider_event_id?: string | null
          type: string
        }
        Update: {
          detail?: string | null
          id?: string
          message_id?: string | null
          occurred_at?: string
          provider_event_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "mail_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_folders: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      mail_messages: {
        Row: {
          bcc_addresses: string[]
          cc_addresses: string[]
          created_at: string
          direction: string
          from_address: string
          from_name: string
          html: string | null
          id: string
          in_reply_to: string | null
          message_id_header: string | null
          provider_id: string | null
          references_header: string | null
          sent_at: string
          status: string
          subject: string
          text_body: string | null
          thread_id: string
          to_addresses: string[]
        }
        Insert: {
          bcc_addresses?: string[]
          cc_addresses?: string[]
          created_at?: string
          direction?: string
          from_address?: string
          from_name?: string
          html?: string | null
          id?: string
          in_reply_to?: string | null
          message_id_header?: string | null
          provider_id?: string | null
          references_header?: string | null
          sent_at?: string
          status?: string
          subject?: string
          text_body?: string | null
          thread_id: string
          to_addresses?: string[]
        }
        Update: {
          bcc_addresses?: string[]
          cc_addresses?: string[]
          created_at?: string
          direction?: string
          from_address?: string
          from_name?: string
          html?: string | null
          id?: string
          in_reply_to?: string | null
          message_id_header?: string | null
          provider_id?: string | null
          references_header?: string | null
          sent_at?: string
          status?: string
          subject?: string
          text_body?: string | null
          thread_id?: string
          to_addresses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "mail_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "mail_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_settings: {
        Row: {
          id: number
          updated_at: string
          webhook_id: string | null
          webhook_secret: string | null
        }
        Insert: {
          id?: number
          updated_at?: string
          webhook_id?: string | null
          webhook_secret?: string | null
        }
        Update: {
          id?: number
          updated_at?: string
          webhook_id?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      mail_threads: {
        Row: {
          binned_at: string | null
          created_at: string
          custom_folder_id: string | null
          folder: string
          follow_up_at: string | null
          has_attachments: boolean
          has_draft: boolean
          has_sent: boolean
          id: string
          last_message_at: string
          message_count: number
          normalized_subject: string
          participants: string
          previous_folder: string | null
          snippet: string
          starred: boolean
          subject: string
          unread: boolean
        }
        Insert: {
          binned_at?: string | null
          created_at?: string
          custom_folder_id?: string | null
          folder?: string
          follow_up_at?: string | null
          has_attachments?: boolean
          has_draft?: boolean
          has_sent?: boolean
          id?: string
          last_message_at?: string
          message_count?: number
          normalized_subject?: string
          participants?: string
          previous_folder?: string | null
          snippet?: string
          starred?: boolean
          subject?: string
          unread?: boolean
        }
        Update: {
          binned_at?: string | null
          created_at?: string
          custom_folder_id?: string | null
          folder?: string
          follow_up_at?: string | null
          has_attachments?: boolean
          has_draft?: boolean
          has_sent?: boolean
          id?: string
          last_message_at?: string
          message_count?: number
          normalized_subject?: string
          participants?: string
          previous_folder?: string | null
          snippet?: string
          starred?: boolean
          subject?: string
          unread?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mail_threads_custom_folder_id_fkey"
            columns: ["custom_folder_id"]
            isOneToOne: false
            referencedRelation: "mail_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author: string
          created_at: string
          id: string
          is_published: boolean
          quote: string
          role: string
          sort_order: number
        }
        Insert: {
          author: string
          created_at?: string
          id?: string
          is_published?: boolean
          quote: string
          role?: string
          sort_order?: number
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          is_published?: boolean
          quote?: string
          role?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
