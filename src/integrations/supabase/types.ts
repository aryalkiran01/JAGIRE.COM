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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          model: string | null
          provider: string | null
          success: boolean | null
          task: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          provider?: string | null
          success?: boolean | null
          task: string
          user_id?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          provider?: string | null
          success?: boolean | null
          task?: string
          user_id?: string
        }
        Relationships: []
      }
      app_user_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      application_events: {
        Row: {
          application_id: string
          created_at: string | null
          event_type: string
          id: string
          message: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          event_type: string
          id?: string
          message?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_match_data: Json | null
          ai_match_score: number | null
          applicant_id: string | null
          applied_at: string | null
          cover_letter: string | null
          created_at: string
          employer_notes: string | null
          id: string
          job_id: string
          match_breakdown: Json | null
          match_score: number | null
          resume_id: string | null
          seeker_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          status_text: string | null
          timeline: Json
          updated_at: string
        }
        Insert: {
          ai_match_data?: Json | null
          ai_match_score?: number | null
          applicant_id?: string | null
          applied_at?: string | null
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          job_id: string
          match_breakdown?: Json | null
          match_score?: number | null
          resume_id?: string | null
          seeker_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          status_text?: string | null
          timeline?: Json
          updated_at?: string
        }
        Update: {
          ai_match_data?: Json | null
          ai_match_score?: number | null
          applicant_id?: string | null
          applied_at?: string | null
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          job_id?: string
          match_breakdown?: Json | null
          match_score?: number | null
          resume_id?: string | null
          seeker_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          status_text?: string | null
          timeline?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          answers: Json | null
          assessment_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          passed: boolean
          score: number | null
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean
          score?: number | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean
          score?: number | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          passing_score: number | null
          questions: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          questions?: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          questions?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          kind: string | null
          name: string
          points: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          kind?: string | null
          name: string
          points?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          kind?: string | null
          name?: string
          points?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string
          blog_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string
          blog_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          blog_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          blog_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blog_id: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          blog_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_id: string | null
          category: string | null
          comments_count: number | null
          content: string
          cover_image: string | null
          cover_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          likes_count: number | null
          published: boolean | null
          published_at: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          comments_count?: number | null
          content: string
          cover_image?: string | null
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          likes_count?: number | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          comments_count?: number | null
          content?: string
          cover_image?: string | null
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          likes_count?: number | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      career_coach_sessions: {
        Row: {
          created_at: string | null
          id: string
          messages: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          updated_at: string | null
          user_a: string | null
          user_b: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          banner_url: string | null
          benefits: Json | null
          company_size: string | null
          created_at: string
          culture: Json | null
          description: string | null
          facebook_url: string | null
          follower_count: number | null
          founded_year: number | null
          headquarters: string | null
          hiring_process: Json | null
          hr_contact_email: string | null
          hr_contact_name: string | null
          hr_contact_phone: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          is_verified: boolean | null
          linkedin_url: string | null
          location: string | null
          locations: Json | null
          logo_url: string | null
          mission: string | null
          name: string
          office_photos: Json | null
          owner_id: string
          pan_number: string | null
          rating_avg: number | null
          review_count: number | null
          size: string | null
          slug: string
          tagline: string | null
          technologies: Json | null
          twitter_url: string | null
          updated_at: string
          vat_number: string | null
          verification_status: string | null
          vision: string | null
          website: string | null
          work_model: string | null
        }
        Insert: {
          banner_url?: string | null
          benefits?: Json | null
          company_size?: string | null
          created_at?: string
          culture?: Json | null
          description?: string | null
          facebook_url?: string | null
          follower_count?: number | null
          founded_year?: number | null
          headquarters?: string | null
          hiring_process?: Json | null
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          locations?: Json | null
          logo_url?: string | null
          mission?: string | null
          name: string
          office_photos?: Json | null
          owner_id: string
          pan_number?: string | null
          rating_avg?: number | null
          review_count?: number | null
          size?: string | null
          slug: string
          tagline?: string | null
          technologies?: Json | null
          twitter_url?: string | null
          updated_at?: string
          vat_number?: string | null
          verification_status?: string | null
          vision?: string | null
          website?: string | null
          work_model?: string | null
        }
        Update: {
          banner_url?: string | null
          benefits?: Json | null
          company_size?: string | null
          created_at?: string
          culture?: Json | null
          description?: string | null
          facebook_url?: string | null
          follower_count?: number | null
          founded_year?: number | null
          headquarters?: string | null
          hiring_process?: Json | null
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          locations?: Json | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          office_photos?: Json | null
          owner_id?: string
          pan_number?: string | null
          rating_avg?: number | null
          review_count?: number | null
          size?: string | null
          slug?: string
          tagline?: string | null
          technologies?: Json | null
          twitter_url?: string | null
          updated_at?: string
          vat_number?: string | null
          verification_status?: string | null
          vision?: string | null
          website?: string | null
          work_model?: string | null
        }
        Relationships: []
      }
      company_reviews: {
        Row: {
          body: string | null
          company_id: string
          cons: string | null
          created_at: string | null
          employer_replied_at: string | null
          employer_reply: string | null
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_current_employee: boolean | null
          job_title: string | null
          pros: string | null
          rating: number
          reviewer_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          company_id: string
          cons?: string | null
          created_at?: string | null
          employer_replied_at?: string | null
          employer_reply?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_current_employee?: boolean | null
          job_title?: string | null
          pros?: string | null
          rating: number
          reviewer_id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string
          cons?: string | null
          created_at?: string | null
          employer_replied_at?: string | null
          employer_reply?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_current_employee?: boolean | null
          job_title?: string | null
          pros?: string | null
          rating?: number
          reviewer_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          company_id: string | null
          created_at: string | null
          follower_id: string
          following_id: string | null
          id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          follower_id?: string
          following_id?: string | null
          id?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          follower_id?: string
          following_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_events: {
        Row: {
          application_id: string
          candidate_email: string | null
          created_at: string | null
          employer_id: string
          end_time: string
          google_event_id: string | null
          id: string
          meet_link: string | null
          message: string | null
          start_time: string
          title: string
        }
        Insert: {
          application_id: string
          candidate_email?: string | null
          created_at?: string | null
          employer_id: string
          end_time: string
          google_event_id?: string | null
          id?: string
          meet_link?: string | null
          message?: string | null
          start_time: string
          title?: string
        }
        Update: {
          application_id?: string
          candidate_email?: string | null
          created_at?: string | null
          employer_id?: string
          end_time?: string
          google_event_id?: string | null
          id?: string
          meet_link?: string | null
          message?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_slots: {
        Row: {
          application_id: string | null
          booked_by: string | null
          calendar_event_id: string | null
          created_at: string | null
          employer_id: string
          end_time: string
          id: string
          is_booked: boolean | null
          job_id: string
          meeting_link: string | null
          notes: string | null
          start_time: string
        }
        Insert: {
          application_id?: string | null
          booked_by?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          employer_id?: string
          end_time: string
          id?: string
          is_booked?: boolean | null
          job_id: string
          meeting_link?: string | null
          notes?: string | null
          start_time: string
        }
        Update: {
          application_id?: string | null
          booked_by?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          employer_id?: string
          end_time?: string
          id?: string
          is_booked?: boolean | null
          job_id?: string
          meeting_link?: string | null
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_slots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_slots_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          accepted_at: string | null
          application_id: string
          candidate_email: string | null
          candidate_id: string | null
          created_at: string | null
          declined_at: string | null
          duration_minutes: number | null
          employer_id: string | null
          google_event_id: string | null
          id: string
          job_id: string | null
          location: string | null
          meet_link: string | null
          meeting_link: string | null
          message: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          candidate_email?: string | null
          candidate_id?: string | null
          created_at?: string | null
          declined_at?: string | null
          duration_minutes?: number | null
          employer_id?: string | null
          google_event_id?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          meet_link?: string | null
          meeting_link?: string | null
          message?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          candidate_email?: string | null
          candidate_id?: string | null
          created_at?: string | null
          declined_at?: string | null
          duration_minutes?: number | null
          employer_id?: string | null
          google_event_id?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          meet_link?: string | null
          meeting_link?: string | null
          message?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jagire: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          missing_skills: Json | null
          overall_match: number | null
          ranking: number | null
          reasons: Json | null
          recommendations: Json | null
          strengths: Json | null
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          missing_skills?: Json | null
          overall_match?: number | null
          ranking?: number | null
          reasons?: Json | null
          recommendations?: Json | null
          strengths?: Json | null
          user_id?: string
          weaknesses?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          missing_skills?: Json | null
          overall_match?: number | null
          ranking?: number | null
          reasons?: Json | null
          recommendations?: Json | null
          strengths?: Json | null
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          applications_count: number | null
          benefits: string | null
          category_id: string | null
          company_id: string
          created_at: string
          currency: string | null
          description: string
          employer_id: string | null
          employment_type: string | null
          experience_level: Database["public"]["Enums"]["experience_level"]
          featured_until: string | null
          id: string
          industry: string | null
          is_featured: boolean | null
          is_remote: boolean | null
          job_category: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          keywords: Json | null
          location: string | null
          posted_by: string
          required_skills: string[] | null
          requirements: string | null
          requirements_list: Json | null
          responsibilities: Json | null
          salary_currency: string | null
          salary_max: number | null
          salary_max_usd: number | null
          salary_min: number | null
          salary_min_usd: number | null
          skills: string[]
          skills_required: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["job_status"]
          technologies: Json | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          description: string
          employer_id?: string | null
          employment_type?: string | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          featured_until?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_remote?: boolean | null
          job_category?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          keywords?: Json | null
          location?: string | null
          posted_by: string
          required_skills?: string[] | null
          requirements?: string | null
          requirements_list?: Json | null
          responsibilities?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_max_usd?: number | null
          salary_min?: number | null
          salary_min_usd?: number | null
          skills?: string[]
          skills_required?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          technologies?: Json | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          description?: string
          employer_id?: string | null
          employment_type?: string | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          featured_until?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_remote?: boolean | null
          job_category?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          keywords?: Json | null
          location?: string | null
          posted_by?: string
          required_skills?: string[] | null
          requirements?: string | null
          requirements_list?: Json | null
          responsibilities?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_max_usd?: number | null
          salary_min?: number | null
          salary_min_usd?: number | null
          skills?: string[]
          skills_required?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          technologies?: Json | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          is_featured: boolean | null
          provider: string | null
          skills: Json | null
          thumbnail_url: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          provider?: string | null
          skills?: Json | null
          thumbnail_url?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          provider?: string | null
          skills?: Json | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      learning_items: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          item_type: string | null
          kind: string | null
          order_index: number | null
          provider: string | null
          skills: string[] | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          item_type?: string | null
          kind?: string | null
          order_index?: number | null
          provider?: string | null
          skills?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          item_type?: string | null
          kind?: string | null
          order_index?: number | null
          provider?: string | null
          skills?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          badges_earned: Json | null
          completed_at: string | null
          course_id: string | null
          created_at: string | null
          id: string
          item_id: string | null
          progress: number | null
          progress_percent: number | null
          score: number | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          badges_earned?: Json | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          progress?: number | null
          progress_percent?: number | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          badges_earned?: Json | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          progress?: number | null
          progress_percent?: number | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "learning_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          application_id: string
          candidate_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          google_event_id: string | null
          id: string
          meeting_url: string | null
          scheduled_at: string
          scheduled_by: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          candidate_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          google_event_id?: string | null
          id?: string
          meeting_url?: string | null
          scheduled_at: string
          scheduled_by: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          candidate_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          google_event_id?: string | null
          id?: string
          meeting_url?: string | null
          scheduled_at?: string
          scheduled_by?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          chat_id: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          job_id: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          chat_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
          subject?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          chat_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_verifications: {
        Row: {
          created_at: string
          esewa_ref_id: string | null
          id: string
          product_code: string | null
          raw_response: Json | null
          status: string | null
          total_amount: number | null
          transaction_uuid: string
          user_id: string | null
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          esewa_ref_id?: string | null
          id?: string
          product_code?: string | null
          raw_response?: Json | null
          status?: string | null
          total_amount?: number | null
          transaction_uuid: string
          user_id?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          esewa_ref_id?: string | null
          id?: string
          product_code?: string | null
          raw_response?: Json | null
          status?: string | null
          total_amount?: number | null
          transaction_uuid?: string
          user_id?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          esewa_ref_id: string | null
          esewa_transaction_id: string | null
          id: string
          job_id: string | null
          metadata: Json | null
          plan_type: string | null
          product_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          esewa_ref_id?: string | null
          esewa_transaction_id?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          plan_type?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          esewa_ref_id?: string | null
          esewa_transaction_id?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          plan_type?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string | null
          content: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id?: string
          body?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          blog_content: string | null
          body: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          likes_count: number | null
          media_urls: Json | null
          shares_count: number | null
          tags: Json | null
          title: string | null
          type: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string
          blog_content?: string | null
          body?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          shares_count?: number | null
          tags?: Json | null
          title?: string | null
          type?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          blog_content?: string | null
          body?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          shares_count?: number | null
          tags?: Json | null
          title?: string | null
          type?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          ats_score: number | null
          availability: string | null
          avatar_url: string | null
          awards: Json | null
          banner_url: string | null
          bio: string | null
          certifications: Json | null
          cover_letter: string | null
          created_at: string
          current_company: string | null
          current_position: string | null
          education: Json | null
          email: string | null
          employment_type_preference: string | null
          expected_salary: number | null
          expected_salary_usd: number | null
          experience: Json | null
          experience_years: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          github_url: string | null
          github_username: string | null
          headline: string | null
          id: string
          industry_preference: Json | null
          interests: Json | null
          is_admin: boolean | null
          is_premium: boolean | null
          job_type_preference: Json | null
          languages: Json | null
          linkedin_imported: boolean | null
          linkedin_url: string | null
          location: string | null
          notice_period: string | null
          overall_score: number | null
          phone: string | null
          portfolio_url: string | null
          preferred_location: string | null
          premium_expires_at: string | null
          profile_completion: number | null
          profile_visibility: string | null
          projects: Json | null
          public_url: string | null
          recommendations: Json | null
          referral_code: string | null
          remote_preference: string | null
          skills: Json | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          technologies: Json | null
          twitter_url: string | null
          updated_at: string
          user_role: string
          volunteer_experience: Json | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          about?: string | null
          ats_score?: number | null
          availability?: string | null
          avatar_url?: string | null
          awards?: Json | null
          banner_url?: string | null
          bio?: string | null
          certifications?: Json | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          email?: string | null
          employment_type_preference?: string | null
          expected_salary?: number | null
          expected_salary_usd?: number | null
          experience?: Json | null
          experience_years?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          github_url?: string | null
          github_username?: string | null
          headline?: string | null
          id: string
          industry_preference?: Json | null
          interests?: Json | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          job_type_preference?: Json | null
          languages?: Json | null
          linkedin_imported?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          notice_period?: string | null
          overall_score?: number | null
          phone?: string | null
          portfolio_url?: string | null
          preferred_location?: string | null
          premium_expires_at?: string | null
          profile_completion?: number | null
          profile_visibility?: string | null
          projects?: Json | null
          public_url?: string | null
          recommendations?: Json | null
          referral_code?: string | null
          remote_preference?: string | null
          skills?: Json | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          technologies?: Json | null
          twitter_url?: string | null
          updated_at?: string
          user_role?: string
          volunteer_experience?: Json | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          about?: string | null
          ats_score?: number | null
          availability?: string | null
          avatar_url?: string | null
          awards?: Json | null
          banner_url?: string | null
          bio?: string | null
          certifications?: Json | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          email?: string | null
          employment_type_preference?: string | null
          expected_salary?: number | null
          expected_salary_usd?: number | null
          experience?: Json | null
          experience_years?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          github_url?: string | null
          github_username?: string | null
          headline?: string | null
          id?: string
          industry_preference?: Json | null
          interests?: Json | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          job_type_preference?: Json | null
          languages?: Json | null
          linkedin_imported?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          notice_period?: string | null
          overall_score?: number | null
          phone?: string | null
          portfolio_url?: string | null
          preferred_location?: string | null
          premium_expires_at?: string | null
          profile_completion?: number | null
          profile_visibility?: string | null
          projects?: Json | null
          public_url?: string | null
          recommendations?: Json | null
          referral_code?: string | null
          remote_preference?: string | null
          skills?: Json | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          technologies?: Json | null
          twitter_url?: string | null
          updated_at?: string
          user_role?: string
          volunteer_experience?: Json | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_user_id: string | null
          referrer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ats_score: number | null
          career_roadmap: Json | null
          created_at: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          formatting_score: number | null
          grammar_score: number | null
          id: string
          is_active: boolean | null
          is_default: boolean
          keyword_score: number | null
          match_breakdown: Json | null
          mime_type: string | null
          overall_score: number | null
          parsed: Json | null
          parsed_data: Json | null
          professionalism_score: number | null
          raw_text: string | null
          resume_data: Json | null
          scores: Json | null
          suggestions: Json | null
          title: string | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          ats_score?: number | null
          career_roadmap?: Json | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          formatting_score?: number | null
          grammar_score?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean
          keyword_score?: number | null
          match_breakdown?: Json | null
          mime_type?: string | null
          overall_score?: number | null
          parsed?: Json | null
          parsed_data?: Json | null
          professionalism_score?: number | null
          raw_text?: string | null
          resume_data?: Json | null
          scores?: Json | null
          suggestions?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          ats_score?: number | null
          career_roadmap?: Json | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          formatting_score?: number | null
          grammar_score?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean
          keyword_score?: number | null
          match_breakdown?: Json | null
          mime_type?: string | null
          overall_score?: number | null
          parsed?: Json | null
          parsed_data?: Json | null
          professionalism_score?: number | null
          raw_text?: string | null
          resume_data?: Json | null
          scores?: Json | null
          suggestions?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      review_replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          review_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          review_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          review_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          id: string
          rating: number | null
          reviewer_id: string | null
          title: string | null
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewer_id?: string | null
          title?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewer_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          esewa_ref_id: string | null
          expires_at: string | null
          id: string
          payment_status: string
          plan_type: string
          started_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          esewa_ref_id?: string | null
          expires_at?: string | null
          id?: string
          payment_status?: string
          plan_type: string
          started_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          esewa_ref_id?: string | null
          expires_at?: string | null
          id?: string
          payment_status?: string
          plan_type?: string
          started_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_users: {
        Row: {
          availability: string | null
          avatar_url: string | null
          awards: Json | null
          banner_url: string | null
          bio: string | null
          certifications: Json | null
          cover_letter: string | null
          created_at: string | null
          current_company: string | null
          current_position: string | null
          education: Json | null
          email: string | null
          employment_type_preference: string | null
          expected_salary_usd: number | null
          experience: Json | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          github_url: string | null
          github_username: string | null
          headline: string | null
          id: string | null
          industry_preference: Json | null
          interests: Json | null
          is_admin: boolean | null
          is_premium: boolean | null
          job_type_preference: Json | null
          languages: Json | null
          linkedin_imported: boolean | null
          linkedin_url: string | null
          location: string | null
          notice_period: string | null
          phone: string | null
          portfolio_url: string | null
          preferred_location: string | null
          premium_expires_at: string | null
          profile_completion: number | null
          profile_visibility: string | null
          projects: Json | null
          public_url: string | null
          recommendations: Json | null
          referral_code: string | null
          remote_preference: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          skills: Json | null
          technologies: Json | null
          twitter_url: string | null
          updated_at: string | null
          user_role: string | null
          volunteer_experience: Json | null
          website: string | null
          years_experience: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_profile_completion: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_notification: {
        Args: {
          _link?: string
          _message?: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_assessment_questions: {
        Args: { _assessment_id: string }
        Returns: Json
      }
      get_or_create_chat: {
        Args: { _user_a: string; _user_b: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_premium: { Args: never; Returns: boolean }
      submit_assessment: {
        Args: { _answers: Json; _assessment_id: string }
        Returns: {
          passed: boolean
          score: number
        }[]
      }
      update_application_status: {
        Args: {
          _actor_id?: string
          _application_id: string
          _new_status: Database["public"]["Enums"]["application_status"]
          _note?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "seeker" | "employer" | "admin" | "job_seeker"
      application_status:
        | "applied"
        | "viewed"
        | "shortlisted"
        | "interview"
        | "selected"
        | "rejected"
        | "reviewing"
        | "interview_scheduled"
        | "interview_completed"
        | "offer"
        | "withdrawn"
      experience_level:
        | "entry"
        | "mid"
        | "senior"
        | "lead"
        | "junior"
        | "executive"
      job_status: "draft" | "published" | "closed" | "active" | "paused"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "remote"
        | "freelance"
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
      app_role: ["seeker", "employer", "admin", "job_seeker"],
      application_status: [
        "applied",
        "viewed",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
        "reviewing",
        "interview_scheduled",
        "interview_completed",
        "offer",
        "withdrawn",
      ],
      experience_level: [
        "entry",
        "mid",
        "senior",
        "lead",
        "junior",
        "executive",
      ],
      job_status: ["draft", "published", "closed", "active", "paused"],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "remote",
        "freelance",
      ],
    },
  },
} as const
