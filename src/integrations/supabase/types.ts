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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          is_present: boolean
          justification: string | null
          student_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          is_present: boolean
          justification?: string | null
          student_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          is_present?: boolean
          justification?: string | null
          student_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          grade: string
          id: string
          name: string
          student_count: number | null
          teacher_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          name: string
          student_count?: number | null
          teacher_id?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          name?: string
          student_count?: number | null
          teacher_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: string[] | null
          author_id: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_published: boolean | null
          priority: string
          published_at: string | null
          target_audience: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          author_id: string
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string
          published_at?: string | null
          target_audience: string[]
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          author_id?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string
          published_at?: string | null
          target_audience?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      declarations: {
        Row: {
          created_at: string
          delivery_date: string | null
          description: string | null
          file_path: string | null
          id: string
          observations: string | null
          processed_at: string | null
          processed_by: string | null
          purpose: string | null
          requested_at: string
          status: string
          student_id: string
          subject_id: string | null
          title: string
          type: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          observations?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purpose?: string | null
          requested_at?: string
          status?: string
          student_id: string
          subject_id?: string | null
          title: string
          type: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          observations?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purpose?: string | null
          requested_at?: string
          status?: string
          student_id?: string
          subject_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "declarations_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declarations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evasions: {
        Row: {
          created_at: string
          date: string
          id: string
          observations: string | null
          reason: string
          reported_by: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          observations?: string | null
          reason: string
          reported_by: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          observations?: string | null
          reason?: string
          reported_by?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evasions_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evasions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          date: string
          id: string
          max_value: number
          student_id: string
          subject_id: string
          teacher_id: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          max_value?: number
          student_id: string
          subject_id: string
          teacher_id: string
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          max_value?: number
          student_id?: string
          subject_id?: string
          teacher_id?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          cep: string | null
          city: string | null
          class_id: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string
          enrollment_date: string | null
          escolaridade: string | null
          full_name: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          instructor_subjects: string[] | null
          name: string
          neighborhood: string | null
          number: string | null
          parent_name: string | null
          phone: string | null
          photo: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
          street: string | null
          student_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          cep?: string | null
          city?: string | null
          class_id?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          enrollment_date?: string | null
          escolaridade?: string | null
          full_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id: string
          instructor_subjects?: string[] | null
          name: string
          neighborhood?: string | null
          number?: string | null
          parent_name?: string | null
          phone?: string | null
          photo?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
          street?: string | null
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          cep?: string | null
          city?: string | null
          class_id?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          enrollment_date?: string | null
          escolaridade?: string | null
          full_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          instructor_subjects?: string[] | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          parent_name?: string | null
          phone?: string | null
          photo?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
          street?: string | null
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          name: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          name: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_instructor_of_subject: {
        Args: { subject: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretary" | "instructor" | "student"
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
      app_role: ["admin", "secretary", "instructor", "student"],
    },
  },
} as const
