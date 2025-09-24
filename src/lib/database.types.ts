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
          role: 'socio' | 'superadmin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'socio' | 'superadmin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'socio' | 'superadmin'
          avatar_url?: string | null
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      distribution_types: {
        Row: {
          id: string
          name: string
          percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          percentage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          product_id: string
          quantity: number
          total: number
          date: string
          recorded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          total: number
          date?: string
          recorded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          total?: number
          date?: string
          recorded_by?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
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
      audit_logs: {
        Row: {
          id: string
          action: string
          user_id: string
          date: string
          details: string
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          user_id: string
          date?: string
          details: string
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          user_id?: string
          date?: string
          details?: string
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
      business_settings: {
        Row: {
          id: string
          business_name: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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