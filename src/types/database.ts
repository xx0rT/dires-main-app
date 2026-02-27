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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          company: string | null
          location: string | null
          is_admin: boolean
          is_trainer: boolean
          trainer_role: string | null
          trainer_specializations: string[] | null
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          company?: string | null
          location?: string | null
          is_admin?: boolean
          is_trainer?: boolean
          trainer_role?: string | null
          trainer_specializations?: string[] | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          company?: string | null
          location?: string | null
          is_admin?: boolean
          is_trainer?: boolean
          trainer_role?: string | null
          trainer_specializations?: string[] | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          trainer_id: string
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trainer_id: string
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trainer_id?: string
          last_message_at?: string | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
