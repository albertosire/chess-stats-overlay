export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationships = Array<{
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      linked_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: "chesscom" | "lichess";
          username: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "chesscom" | "lichess";
          username: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: "chesscom" | "lichess";
          username?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      overlay_configs: {
        Row: {
          id: string;
          user_id: string;
          active_theme_id: string;
          primary_color: string;
          accent_color: string;
          font_family: string;
          show_delta_elo: boolean;
          show_winrate: boolean;
          show_streak: boolean;
          custom_sponsor_logo_url: string | null;
          game_type: string;
          period_mode: string;
          refresh_seconds: number;
          time_control: string | null;
          display_name: string | null;
          primary_provider: "chesscom" | "lichess";
          secondary_provider: "chesscom" | "lichess" | null;
          obs_token: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          active_theme_id?: string;
          primary_color?: string;
          accent_color?: string;
          font_family?: string;
          show_delta_elo?: boolean;
          show_winrate?: boolean;
          show_streak?: boolean;
          custom_sponsor_logo_url?: string | null;
          game_type?: string;
          period_mode?: string;
          refresh_seconds?: number;
          time_control?: string | null;
          display_name?: string | null;
          primary_provider?: "chesscom" | "lichess";
          secondary_provider?: "chesscom" | "lichess" | null;
          obs_token?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          active_theme_id?: string;
          primary_color?: string;
          accent_color?: string;
          font_family?: string;
          show_delta_elo?: boolean;
          show_winrate?: boolean;
          show_streak?: boolean;
          custom_sponsor_logo_url?: string | null;
          game_type?: string;
          period_mode?: string;
          refresh_seconds?: number;
          time_control?: string | null;
          display_name?: string | null;
          primary_provider?: "chesscom" | "lichess";
          secondary_provider?: "chesscom" | "lichess" | null;
          obs_token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          status: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      theme_purchases: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          stripe_session_id: string | null;
          amount_paid: number;
          currency: string;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_id: string;
          stripe_session_id?: string | null;
          amount_paid?: number;
          currency?: string;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme_id?: string;
          stripe_session_id?: string | null;
          amount_paid?: number;
          currency?: string;
          purchased_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_overlay_by_token: {
        Args: { p_token: string };
        Returns: Json;
      };
      is_pro_user: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type OverlayConfigRow = Database["public"]["Tables"]["overlay_configs"]["Row"];
export type LinkedAccountRow = Database["public"]["Tables"]["linked_accounts"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

// silence unused type helper
export type _Relationships = Relationships;
