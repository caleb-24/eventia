// Generado con `npm run db:types` desde el proyecto Supabase. No editar a mano.
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
      categorias: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["category_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["category_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["category_type"]
        }
        Relationships: []
      }
      conversaciones_ia: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_ia_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_ia_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "totales_evento"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "conversaciones_ia_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidad: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          start_time: string
          status: Database["public"]["Enums"]["availability_status"]
          venue_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          start_time: string
          status?: Database["public"]["Enums"]["availability_status"]
          venue_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["availability_status"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidad_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lugares"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          budget: number | null
          city: string | null
          created_at: string
          date: string | null
          description: string | null
          end_time: string | null
          event_type_id: string
          guests: number
          id: string
          name: string
          special_needs: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          city?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          event_type_id: string
          guests: number
          id?: string
          name: string
          special_needs?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          city?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          event_type_id?: string
          guests?: number
          id?: string
          name?: string
          special_needs?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      imagenes_lugar: {
        Row: {
          created_at: string
          id: string
          image_url: string
          position: number
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          position?: number
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagenes_lugar_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lugares"
            referencedColumns: ["id"]
          },
        ]
      }
      lugares: {
        Row: {
          address: string | null
          capacity: number
          category_id: string
          city: string
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          price: number
          provider_id: string
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity: number
          category_id: string
          city: string
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          price: number
          provider_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number
          category_id?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          price?: number
          provider_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lugares_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "perfiles_proveedor"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_ia: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_ia_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversaciones_ia"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_proveedor: {
        Row: {
          address: string | null
          business_name: string
          city: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          business_name: string
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_proveedor_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          created_at: string
          discount: number
          event_id: string
          extra_costs: number
          id: string
          period: unknown
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          venue_id: string
          venue_price: number
        }
        Insert: {
          created_at?: string
          discount?: number
          event_id: string
          extra_costs?: number
          id?: string
          period: unknown
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          venue_id: string
          venue_price: number
        }
        Update: {
          created_at?: string
          discount?: number
          event_id?: string
          extra_costs?: number
          id?: string
          period?: unknown
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          venue_id?: string
          venue_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservas_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "totales_evento"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "reservas_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lugares"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          provider_id: string
          status: Database["public"]["Enums"]["listing_status"]
          unit: Database["public"]["Enums"]["service_unit"]
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          provider_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          unit?: Database["public"]["Enums"]["service_unit"]
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          provider_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          unit?: Database["public"]["Enums"]["service_unit"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "perfiles_proveedor"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_evento: {
        Row: {
          created_at: string
          event_id: string
          id: string
          quantity: number
          service_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          quantity?: number
          service_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          subtotal?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          quantity?: number
          service_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicios_evento_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_evento_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "totales_evento"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "servicios_evento_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      valoraciones: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          service_id: string | null
          user_id: string
          venue_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          service_id?: string | null
          user_id: string
          venue_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          service_id?: string | null
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valoraciones_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valoraciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valoraciones_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lugares"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      totales_evento: {
        Row: {
          budget: number | null
          discount: number | null
          event_id: string | null
          extra_costs: number | null
          remaining: number | null
          reservation_id: string | null
          services_total: number | null
          total: number | null
          venue_price: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_estado_evento: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      cancelar_reserva: { Args: { p_reserva_id: string }; Returns: undefined }
      completar_eventos_pasados: { Args: never; Returns: number }
      crear_reserva: {
        Args: { p_event_id: string; p_venue_id: string }
        Returns: string
      }
      es_dueno_evento: { Args: { p_event_id: string }; Returns: boolean }
      es_dueno_lugar: { Args: { p_venue_id: string }; Returns: boolean }
      es_dueno_servicio: { Args: { p_service_id: string }; Returns: boolean }
      es_mi_cliente: { Args: { p_user_id: string }; Returns: boolean }
      es_proveedor_del_evento: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      es_sistema: { Args: never; Returns: boolean }
      event_period: {
        Args: { p_date: string; p_end: string; p_start: string }
        Returns: unknown
      }
      is_admin: { Args: never; Returns: boolean }
      mi_proveedor_id: { Args: never; Returns: string }
      ocupacion_lugar: {
        Args: { p_desde: string; p_hasta: string; p_venue_id: string }
        Returns: {
          ends_at: string
          starts_at: string
          status: string
        }[]
      }
      responder_reserva: {
        Args: { p_aceptar: boolean; p_reserva_id: string }
        Returns: Database["public"]["Enums"]["reservation_status"]
      }
      responder_servicio: {
        Args: { p_aceptar: boolean; p_servicio_evento_id: string }
        Returns: Database["public"]["Enums"]["reservation_status"]
      }
    }
    Enums: {
      availability_status: "AVAILABLE" | "BLOCKED"
      category_type: "venue" | "service" | "event"
      event_status: "DRAFT" | "PLANNED" | "BOOKED" | "COMPLETED" | "CANCELLED"
      listing_status: "ACTIVE" | "INACTIVE" | "UNDER_REVIEW"
      message_role: "user" | "assistant" | "system"
      reservation_status:
        | "PENDING"
        | "CONFIRMED"
        | "REJECTED"
        | "CANCELLED"
        | "COMPLETED"
      service_unit: "per_event" | "per_person" | "per_hour"
      user_role: "client" | "provider" | "admin"
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
      availability_status: ["AVAILABLE", "BLOCKED"],
      category_type: ["venue", "service", "event"],
      event_status: ["DRAFT", "PLANNED", "BOOKED", "COMPLETED", "CANCELLED"],
      listing_status: ["ACTIVE", "INACTIVE", "UNDER_REVIEW"],
      message_role: ["user", "assistant", "system"],
      reservation_status: [
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
      ],
      service_unit: ["per_event", "per_person", "per_hour"],
      user_role: ["client", "provider", "admin"],
    },
  },
} as const
