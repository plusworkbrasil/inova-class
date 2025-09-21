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
      audit_logs: {
        Row: {
          accessed_fields: string[] | null
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_fields?: string[] | null
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_fields?: string[] | null
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          student_count: number | null
          teacher_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          student_count?: number | null
          teacher_id?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
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
          category: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_published: boolean | null
          priority: string
          published_at: string | null
          read_by: string[] | null
          target_audience: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          author_id: string
          category?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string
          published_at?: string | null
          read_by?: string[] | null
          target_audience: string[]
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string
          published_at?: string | null
          read_by?: string[] | null
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
      equipment: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          location: string | null
          model: string | null
          name: string
          observations: string | null
          purchase_date: string | null
          responsible_id: string | null
          serial_number: string | null
          status: string
          type: string
          updated_at: string
          warranty_date: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name: string
          observations?: string | null
          purchase_date?: string | null
          responsible_id?: string | null
          serial_number?: string | null
          status?: string
          type: string
          updated_at?: string
          warranty_date?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          observations?: string | null
          purchase_date?: string | null
          responsible_id?: string | null
          serial_number?: string | null
          status?: string
          type?: string
          updated_at?: string
          warranty_date?: string | null
        }
        Relationships: []
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
          observations: string | null
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
          observations?: string | null
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
          observations?: string | null
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
          allergies: string | null
          auto_student_id: number | null
          avatar: string | null
          birth_date: string | null
          birth_place: string | null
          blood_type: string | null
          cep: string | null
          city: string | null
          class_id: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string
          emergency_contact: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          enrollment_date: string | null
          enrollment_number: string | null
          escolaridade: string | null
          father_name: string | null
          full_name: string | null
          gender: string | null
          guardian_cpf: string | null
          guardian_email: string | null
          guardian_income: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_profession: string | null
          guardian_workplace: string | null
          health_insurance: string | null
          id: string
          instructor_subjects: string[] | null
          marital_status: string | null
          medical_conditions: string | null
          medical_info: string | null
          medications: string | null
          mother_name: string | null
          name: string
          nationality: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          photo: string | null
          previous_school: string | null
          profession: string | null
          rg: string | null
          role: Database["public"]["Enums"]["app_role"]
          social_id: string | null
          special_needs: string | null
          state: string | null
          status: string | null
          street: string | null
          student_id: string | null
          teacher_id: string | null
          transportation: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          auto_student_id?: number | null
          avatar?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blood_type?: string | null
          cep?: string | null
          city?: string | null
          class_id?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_date?: string | null
          enrollment_number?: string | null
          escolaridade?: string | null
          father_name?: string | null
          full_name?: string | null
          gender?: string | null
          guardian_cpf?: string | null
          guardian_email?: string | null
          guardian_income?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_profession?: string | null
          guardian_workplace?: string | null
          health_insurance?: string | null
          id: string
          instructor_subjects?: string[] | null
          marital_status?: string | null
          medical_conditions?: string | null
          medical_info?: string | null
          medications?: string | null
          mother_name?: string | null
          name: string
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo?: string | null
          previous_school?: string | null
          profession?: string | null
          rg?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          social_id?: string | null
          special_needs?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          student_id?: string | null
          teacher_id?: string | null
          transportation?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          auto_student_id?: number | null
          avatar?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blood_type?: string | null
          cep?: string | null
          city?: string | null
          class_id?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_date?: string | null
          enrollment_number?: string | null
          escolaridade?: string | null
          father_name?: string | null
          full_name?: string | null
          gender?: string | null
          guardian_cpf?: string | null
          guardian_email?: string | null
          guardian_income?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_profession?: string | null
          guardian_workplace?: string | null
          health_insurance?: string | null
          id?: string
          instructor_subjects?: string[] | null
          marital_status?: string | null
          medical_conditions?: string | null
          medical_info?: string | null
          medications?: string | null
          mother_name?: string | null
          name?: string
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo?: string | null
          previous_school?: string | null
          profession?: string | null
          rg?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          social_id?: string | null
          special_needs?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          student_id?: string | null
          teacher_id?: string | null
          transportation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_academic_info: {
        Row: {
          academic_status: string | null
          class_id: string | null
          created_at: string | null
          enrollment_date: string | null
          id: string
          notes: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          academic_status?: string | null
          class_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          notes?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          academic_status?: string | null
          class_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          notes?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_academic_info_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string | null
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          teacher_id: string | null
          updated_at: string
          workload: number | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          teacher_id?: string | null
          updated_at?: string
          workload?: number | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          teacher_id?: string | null
          updated_at?: string
          workload?: number | null
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
      system_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_medical_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_access_personal_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_access_profile_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_instructor_students: {
        Args: Record<PropertyKey, never>
        Returns: {
          class_id: string
          enrollment_number: string
          id: string
          name: string
          status: string
          student_id: string
        }[]
      }
      get_safe_student_data: {
        Args: { target_student_id: string }
        Returns: {
          academic_status: string
          class_reference: string
          enrollment_number: string
          student_name: string
          student_number: string
        }[]
      }
      get_student_basic_info_for_instructor: {
        Args: { target_student_id: string }
        Returns: {
          class_id: string
          email: string
          enrollment_number: string
          id: string
          name: string
          status: string
          student_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      instructor_can_view_student: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      is_instructor_of_subject: {
        Args: { subject: string; user_id: string }
        Returns: boolean
      }
      log_sensitive_access: {
        Args: {
          p_accessed_fields: string[]
          p_action: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      setup_test_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "secretary" | "instructor" | "student" | "teacher"
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
      app_role: ["admin", "secretary", "instructor", "student", "teacher"],
    },
  },
} as const
