export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      account: {
        Row: {
          access_token: string | null;
          access_token_expires_at: string | null;
          account_id: string;
          created_at: string;
          id: string;
          id_token: string | null;
          password: string | null;
          provider_id: string;
          refresh_token: string | null;
          refresh_token_expires_at: string | null;
          scope: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token?: string | null;
          access_token_expires_at?: string | null;
          account_id: string;
          created_at?: string;
          id?: string;
          id_token?: string | null;
          password?: string | null;
          provider_id: string;
          refresh_token?: string | null;
          refresh_token_expires_at?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string | null;
          access_token_expires_at?: string | null;
          account_id?: string;
          created_at?: string;
          id?: string;
          id_token?: string | null;
          password?: string | null;
          provider_id?: string;
          refresh_token?: string | null;
          refresh_token_expires_at?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_user_id_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      invitation: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          inviter_id: string;
          organization_id: string;
          role: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          inviter_id: string;
          organization_id: string;
          role?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          inviter_id?: string;
          organization_id?: string;
          role?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitation_inviter_id_user_id_fk";
            columns: ["inviter_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitation_organization_id_organization_id_fk";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organization";
            referencedColumns: ["id"];
          },
        ];
      };
      member: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_organization_id_organization_id_fk";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organization";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_user_id_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      note: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          id: string;
          org_id: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          org_id: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          org_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_created_by_user_id_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_org_id_organization_id_fk";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization";
            referencedColumns: ["id"];
          },
        ];
      };
      organization: {
        Row: {
          created_at: string;
          id: string;
          logo: string | null;
          metadata: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo?: string | null;
          metadata?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo?: string | null;
          metadata?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      passkey: {
        Row: {
          aaguid: string | null;
          backed_up: boolean;
          counter: number;
          created_at: string | null;
          credential_id: string;
          device_type: string;
          id: string;
          name: string | null;
          public_key: string;
          transports: string | null;
          user_id: string;
        };
        Insert: {
          aaguid?: string | null;
          backed_up: boolean;
          counter: number;
          created_at?: string | null;
          credential_id: string;
          device_type: string;
          id?: string;
          name?: string | null;
          public_key: string;
          transports?: string | null;
          user_id: string;
        };
        Update: {
          aaguid?: string | null;
          backed_up?: boolean;
          counter?: number;
          created_at?: string | null;
          credential_id?: string;
          device_type?: string;
          id?: string;
          name?: string | null;
          public_key?: string;
          transports?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passkey_user_id_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limit: {
        Row: {
          count: number;
          id: string;
          key: string;
          last_request: number;
        };
        Insert: {
          count: number;
          id?: string;
          key: string;
          last_request: number;
        };
        Update: {
          count?: number;
          id?: string;
          key?: string;
          last_request?: number;
        };
        Relationships: [];
      };
      session: {
        Row: {
          active_organization_id: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          impersonated_by: string | null;
          ip_address: string | null;
          token: string;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          active_organization_id?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          impersonated_by?: string | null;
          ip_address?: string | null;
          token: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          active_organization_id?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          impersonated_by?: string | null;
          ip_address?: string | null;
          token?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_user_id_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user: {
        Row: {
          ban_expires: string | null;
          ban_reason: string | null;
          banned: boolean | null;
          created_at: string;
          email: string;
          email_verified: boolean;
          id: string;
          image: string | null;
          last_sign_in_at: string | null;
          name: string;
          role: string | null;
          updated_at: string;
        };
        Insert: {
          ban_expires?: string | null;
          ban_reason?: string | null;
          banned?: boolean | null;
          created_at?: string;
          email: string;
          email_verified?: boolean;
          id?: string;
          image?: string | null;
          last_sign_in_at?: string | null;
          name: string;
          role?: string | null;
          updated_at?: string;
        };
        Update: {
          ban_expires?: string | null;
          ban_reason?: string | null;
          banned?: boolean | null;
          created_at?: string;
          email?: string;
          email_verified?: boolean;
          id?: string;
          image?: string | null;
          last_sign_in_at?: string | null;
          name?: string;
          role?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      verification: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          identifier: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          identifier: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          identifier?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_org_id: { Args: never; Returns: string };
      current_org_role: { Args: never; Returns: string };
      is_org_admin: { Args: never; Returns: boolean };
      shares_org_with: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
