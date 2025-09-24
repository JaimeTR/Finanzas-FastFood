export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'socio' | 'administrador'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'socio' | 'administrador'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'socio' | 'administrador'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          id: string
          product_id: string
          quantity: number
          unit_price: number
          total: number
          date: string
          recorded_by: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          unit_price: number
          total: number
          date?: string
          recorded_by: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total?: number
          date?: string
          recorded_by?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          category_id: string
          date: string
          recorded_by: string
          receipt_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          category_id: string
          date?: string
          recorded_by: string
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          category_id?: string
          date?: string
          recorded_by?: string
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description: string | null
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          description?: string | null
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          description?: string | null
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          operation: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          user_id: string
          user_name: string
          user_role: string
          description: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          operation: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          user_id: string
          user_name: string
          user_role: string
          description?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          operation?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          user_id?: string
          user_name?: string
          user_role?: string
          description?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          login_time: string
          logout_time: string | null
          ip_address: string | null
          user_agent: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          login_time?: string
          logout_time?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          login_time?: string
          logout_time?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      sales_detailed: {
        Row: {
          id: string
          quantity: number
          unit_price: number
          total: number
          date: string
          notes: string | null
          product_name: string
          recorded_by_name: string
          recorded_by_role: string
          created_at: string
        }
        Relationships: []
      }
      expenses_detailed: {
        Row: {
          id: string
          description: string
          amount: number
          date: string
          notes: string | null
          category_name: string
          recorded_by_name: string
          recorded_by_role: string
          created_at: string
        }
        Relationships: []
      }
      daily_financial_summary: {
        Row: {
          date: string
          total_sales: number
          total_expenses: number
          net_profit: number
          sales_count: number
          expenses_count: number
        }
        Relationships: []
      }
      top_selling_products: {
        Row: {
          name: string
          total_quantity: number
          total_revenue: number
          times_sold: number
          avg_sale_amount: number
        }
        Relationships: []
      }
      user_activity_summary: {
        Row: {
          name: string
          role: string
          sales_registered: number
          expenses_registered: number
          total_sales_amount: number
          total_expenses_amount: number
          last_activity: string | null
        }
        Relationships: []
      }
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