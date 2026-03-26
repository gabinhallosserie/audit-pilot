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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_plan_processes: {
        Row: {
          created_at: string
          date: string | null
          duration: string | null
          id: string
          mission_id: string
          name: string
          responsible: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          duration?: string | null
          id: string
          mission_id: string
          name: string
          responsible?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          duration?: string | null
          id?: string
          mission_id?: string
          name?: string
          responsible?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_plan_processes_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_requests: {
        Row: {
          audit_type: string
          budget: string | null
          company: string
          created_at: string
          desired_date: string
          estimated_duration: string
          id: string
          perimetre: string
          referentiel: string
          requester_email: string
          requester_name: string
          status: string
        }
        Insert: {
          audit_type: string
          budget?: string | null
          company: string
          created_at?: string
          desired_date: string
          estimated_duration?: string
          id?: string
          perimetre?: string
          referentiel: string
          requester_email: string
          requester_name: string
          status?: string
        }
        Update: {
          audit_type?: string
          budget?: string | null
          company?: string
          created_at?: string
          desired_date?: string
          estimated_duration?: string
          id?: string
          perimetre?: string
          referentiel?: string
          requester_email?: string
          requester_name?: string
          status?: string
        }
        Relationships: []
      }
      audits: {
        Row: {
          audite: string
          auditeur: string
          company: string
          created_at: string
          date: string
          id: string
          perimetre: string
          referentiel: string
          status: string
          title: string
        }
        Insert: {
          audite: string
          auditeur: string
          company: string
          created_at?: string
          date: string
          id: string
          perimetre: string
          referentiel: string
          status?: string
          title: string
        }
        Update: {
          audite?: string
          auditeur?: string
          company?: string
          created_at?: string
          date?: string
          id?: string
          perimetre?: string
          referentiel?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          checked: boolean
          clause: string
          description: string
          id: string
          mission_id: string
        }
        Insert: {
          checked?: boolean
          clause: string
          description: string
          id: string
          mission_id: string
        }
        Update: {
          checked?: boolean
          clause?: string
          description?: string
          id?: string
          mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_actions: {
        Row: {
          created_at: string
          deadline: string | null
          expected_evidence: string | null
          finding_id: string
          id: string
          mission_id: string
          responsible: string
          status: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          expected_evidence?: string | null
          finding_id: string
          id: string
          mission_id: string
          responsible?: string
          status?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          expected_evidence?: string | null
          finding_id?: string
          id?: string
          mission_id?: string
          responsible?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          finding_id: string
          id: string
          mission_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          finding_id: string
          id: string
          mission_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          finding_id?: string
          id?: string
          mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finding_attachments_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          clause: string | null
          created_at: string
          description: string
          evidence: string | null
          id: string
          mission_id: string
          type: string
        }
        Insert: {
          clause?: string | null
          created_at?: string
          description: string
          evidence?: string | null
          id: string
          mission_id: string
          type: string
        }
        Update: {
          clause?: string | null
          created_at?: string
          description?: string
          evidence?: string | null
          id?: string
          mission_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          mission_id: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mission_id: string
          sender_name: string
          sender_role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mission_id?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          audit_id: string
          company: string
          contact: string
          created_at: string
          date: string
          id: string
          notes: string | null
          plan_validated: boolean
          referentiel: string
          status: string
          title: string
        }
        Insert: {
          audit_id: string
          company: string
          contact: string
          created_at?: string
          date: string
          id: string
          notes?: string | null
          plan_validated?: boolean
          referentiel: string
          status?: string
          title: string
        }
        Update: {
          audit_id?: string
          company?: string
          contact?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          plan_validated?: boolean
          referentiel?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mission_id: string | null
          read: boolean
          target_role: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mission_id?: string | null
          read?: boolean
          target_role: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mission_id?: string | null
          read?: boolean
          target_role?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_participants: {
        Row: {
          id: string
          mission_id: string
          name: string
          organisation: string | null
          role: string | null
        }
        Insert: {
          id: string
          mission_id: string
          name: string
          organisation?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          mission_id?: string
          name?: string
          organisation?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opening_participants_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_reports: {
        Row: {
          agenda: Json | null
          created_at: string
          id: string
          mission_id: string
          mission_started: boolean
          perimetre: string | null
          remarques: string | null
        }
        Insert: {
          agenda?: Json | null
          created_at?: string
          id?: string
          mission_id: string
          mission_started?: boolean
          perimetre?: string | null
          remarques?: string | null
        }
        Update: {
          agenda?: Json | null
          created_at?: string
          id?: string
          mission_id?: string
          mission_started?: boolean
          perimetre?: string | null
          remarques?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opening_reports_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_checklist_items: {
        Row: {
          checked: boolean
          id: string
          label: string
          process_id: string
        }
        Insert: {
          checked?: boolean
          id: string
          label: string
          process_id: string
        }
        Update: {
          checked?: boolean
          id?: string
          label?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_checklist_items_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "audit_plan_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          mission_id: string
          rater_role: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          mission_id: string
          rater_role: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          rater_role?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_accounts: {
        Row: {
          account_type: string
          accreditations: string[] | null
          auditeur_statut: string | null
          auditeurs_rattaches: string[] | null
          certifications_visees: string[] | null
          created_at: string
          domaines_expertise: string[] | null
          email: string
          id: string
          justificatifs_paths: string[] | null
          langues: string[] | null
          nom: string | null
          phone: string | null
          prenom: string | null
          raison_sociale: string | null
          referentiels_maitrises: string[] | null
          secteur: string | null
          siret: string | null
          status: string
          taille: string | null
          tarification: string | null
          zone_geographique: string | null
        }
        Insert: {
          account_type: string
          accreditations?: string[] | null
          auditeur_statut?: string | null
          auditeurs_rattaches?: string[] | null
          certifications_visees?: string[] | null
          created_at?: string
          domaines_expertise?: string[] | null
          email: string
          id?: string
          justificatifs_paths?: string[] | null
          langues?: string[] | null
          nom?: string | null
          phone?: string | null
          prenom?: string | null
          raison_sociale?: string | null
          referentiels_maitrises?: string[] | null
          secteur?: string | null
          siret?: string | null
          status?: string
          taille?: string | null
          tarification?: string | null
          zone_geographique?: string | null
        }
        Update: {
          account_type?: string
          accreditations?: string[] | null
          auditeur_statut?: string | null
          auditeurs_rattaches?: string[] | null
          certifications_visees?: string[] | null
          created_at?: string
          domaines_expertise?: string[] | null
          email?: string
          id?: string
          justificatifs_paths?: string[] | null
          langues?: string[] | null
          nom?: string | null
          phone?: string | null
          prenom?: string | null
          raison_sociale?: string | null
          referentiels_maitrises?: string[] | null
          secteur?: string | null
          siret?: string | null
          status?: string
          taille?: string | null
          tarification?: string | null
          zone_geographique?: string | null
        }
        Relationships: []
      }
      signatures: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          signature_data: string
          signer_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          signature_data: string
          signer_role: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          signature_data?: string
          signer_role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
