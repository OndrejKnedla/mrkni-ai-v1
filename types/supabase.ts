export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      image_generations: {
        Row: {
          created_at: string
          id: string
          image_url: string
          model: string
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          model: string
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          model?: string
          prompt?: string
          user_id?: string
        }
      }
      interested_users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          premium: boolean
          premium_until: string | null
          remaining_image_credits: number
          remaining_video_credits: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          premium?: boolean
          premium_until?: string | null
          remaining_image_credits?: number
          remaining_video_credits?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          premium?: boolean
          premium_until?: string | null
          remaining_image_credits?: number
          remaining_video_credits?: number
        }
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: string
          status?: string
          user_id?: string
        }
      }
      video_generations: {
        Row: {
          created_at: string
          id: string
          model: string
          prompt: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          model: string
          prompt: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          prompt?: string
          user_id?: string
          video_url?: string
        }
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
