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
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
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
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          details: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string | null;
          full_name: string | null;
          headline: string | null;
          bio: string | null;
        };
        Insert: {
          id?: string | null;
          full_name?: string | null;
          headline?: string | null;
          bio?: string | null;
        };
        Update: {
          id?: string | null;
          full_name?: string | null;
          headline?: string | null;
          bio?: string | null;
        };
        Relationships: [];
      };
      app_user_connections: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          scopes: string[] | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          provider: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      application_events: {
        Row: {
          id: string;
          application_id: string;
          event_type: string;
          message: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          event_type: string;
          message?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string;
          event_type?: string;
          message?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          seeker_id: string | null;
          resume_id: string | null;
          status: Database["public"]["Enums"]["application_status"];
          match_score: string | null;
          cover_letter: string | null;
          timeline: Json;
          created_at: string;
          updated_at: string;
          match_breakdown: Json | null;
          applicant_id: string | null;
          ai_match_score: number | null;
          ai_match_data: Json | null;
          employer_notes: string | null;
          status_text: string | null;
          applied_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          seeker_id?: string | null;
          resume_id?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          match_score?: string | null;
          cover_letter?: string | null;
          timeline?: Json;
          created_at?: string;
          updated_at?: string;
          match_breakdown?: Json | null;
          applicant_id?: string | null;
          ai_match_score?: number | null;
          ai_match_data?: Json | null;
          employer_notes?: string | null;
          status_text?: string | null;
          applied_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          seeker_id?: string | null;
          resume_id?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          match_score?: string | null;
          cover_letter?: string | null;
          timeline?: Json;
          created_at?: string;
          updated_at?: string;
          match_breakdown?: Json | null;
          applicant_id?: string | null;
          ai_match_score?: number | null;
          ai_match_data?: Json | null;
          employer_notes?: string | null;
          status_text?: string | null;
          applied_at?: string | null;
        };
        Relationships: [];
      };
      assessment_attempts: {
        Row: {
          id: string;
          user_id: string | null;
          assessment_id: string | null;
          score: number | null;
          answers: Json | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string | null;
          passed: boolean;
          status: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          assessment_id?: string | null;
          score?: number | null;
          answers?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          passed?: boolean;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          assessment_id?: string | null;
          score?: number | null;
          answers?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          passed?: boolean;
          status?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          difficulty: string | null;
          duration_minutes: number | null;
          passing_score: number | null;
          is_active: boolean | null;
          created_at: string | null;
          created_by: string | null;
          questions: Json;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          passing_score?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          questions?: Json;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          passing_score?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          questions?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      blogs: {
        Row: {
          id: string;
          author_id: string | null;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image: string | null;
          category: string | null;
          tags: string[] | null;
          status: string | null;
          views_count: number | null;
          created_at: string | null;
          updated_at: string | null;
          cover_url: string | null;
          published: boolean | null;
          published_at: string | null;
          comments_count: number | null;
          likes_count: number | null;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          cover_image?: string | null;
          category?: string | null;
          tags?: string[] | null;
          status?: string | null;
          views_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          cover_url?: string | null;
          published?: boolean | null;
          published_at?: string | null;
          comments_count?: number | null;
          likes_count?: number | null;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          cover_image?: string | null;
          category?: string | null;
          tags?: string[] | null;
          status?: string | null;
          views_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          cover_url?: string | null;
          published?: boolean | null;
          published_at?: string | null;
          comments_count?: number | null;
          likes_count?: number | null;
        };
        Relationships: [];
      };
      blog_comments: {
        Row: {
          id: string;
          blog_id: string;
          author_id: string;
          content: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          blog_id: string;
          author_id?: string;
          content: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          blog_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      blog_likes: {
        Row: {
          id: string;
          blog_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          blog_id: string;
          user_id?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          blog_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          job_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string | null;
          description: string | null;
          icon: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
        };
        Relationships: [];
      };
      chat_participants: {
        Row: {
          id: string;
          chat_id: string | null;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          chat_id?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          user_a: string | null;
          user_b: string | null;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          user_a?: string | null;
          user_b?: string | null;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          user_a?: string | null;
          user_b?: string | null;
          last_message_at?: string | null;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          website: string | null;
          description: string | null;
          location: string | null;
          industry: string | null;
          size: string | null;
          created_at: string;
          updated_at: string;
          banner_url: string | null;
          company_size: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          is_verified: boolean | null;
          mission: string | null;
          vision: string | null;
          culture: Json | null;
          benefits: Json | null;
          technologies: Json | null;
          office_photos: Json | null;
          hiring_process: Json | null;
          locations: Json | null;
          facebook_url: string | null;
          instagram_url: string | null;
          verification_status: string | null;
          pan_number: string | null;
          vat_number: string | null;
          hr_contact_name: string | null;
          hr_contact_email: string | null;
          hr_contact_phone: string | null;
          work_model: string | null;
          founded_year: number | null;
          rating_avg: string | null;
          review_count: number | null;
          follower_count: number | null;
          headquarters: string | null;
          tagline: string | null;
          cover_url: string | null;
          verified: boolean | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          website?: string | null;
          description?: string | null;
          location?: string | null;
          industry?: string | null;
          size?: string | null;
          created_at?: string;
          updated_at?: string;
          banner_url?: string | null;
          company_size?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          is_verified?: boolean | null;
          mission?: string | null;
          vision?: string | null;
          culture?: Json | null;
          benefits?: Json | null;
          technologies?: Json | null;
          office_photos?: Json | null;
          hiring_process?: Json | null;
          locations?: Json | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          verification_status?: string | null;
          pan_number?: string | null;
          vat_number?: string | null;
          hr_contact_name?: string | null;
          hr_contact_email?: string | null;
          hr_contact_phone?: string | null;
          work_model?: string | null;
          founded_year?: number | null;
          rating_avg?: string | null;
          review_count?: number | null;
          follower_count?: number | null;
          headquarters?: string | null;
          tagline?: string | null;
          cover_url?: string | null;
          verified?: boolean | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          website?: string | null;
          description?: string | null;
          location?: string | null;
          industry?: string | null;
          size?: string | null;
          created_at?: string;
          updated_at?: string;
          banner_url?: string | null;
          company_size?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          is_verified?: boolean | null;
          mission?: string | null;
          vision?: string | null;
          culture?: Json | null;
          benefits?: Json | null;
          technologies?: Json | null;
          office_photos?: Json | null;
          hiring_process?: Json | null;
          locations?: Json | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          verification_status?: string | null;
          pan_number?: string | null;
          vat_number?: string | null;
          hr_contact_name?: string | null;
          hr_contact_email?: string | null;
          hr_contact_phone?: string | null;
          work_model?: string | null;
          founded_year?: number | null;
          rating_avg?: string | null;
          review_count?: number | null;
          follower_count?: number | null;
          headquarters?: string | null;
          tagline?: string | null;
          cover_url?: string | null;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      company_reviews: {
        Row: {
          id: string;
          company_id: string;
          reviewer_id: string;
          rating: number;
          title: string;
          body: string | null;
          pros: string | null;
          cons: string | null;
          is_current_employee: boolean | null;
          job_title: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          reviewer_id?: string;
          rating: number;
          title: string;
          body?: string | null;
          pros?: string | null;
          cons?: string | null;
          is_current_employee?: boolean | null;
          job_title?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          reviewer_id?: string;
          rating?: number;
          title?: string;
          body?: string | null;
          pros?: string | null;
          cons?: string | null;
          is_current_employee?: boolean | null;
          job_title?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      interview_events: {
        Row: {
          id: string;
          application_id: string;
          employer_id: string;
          candidate_email: string | null;
          title: string;
          start_time: string;
          end_time: string;
          meet_link: string | null;
          google_event_id: string | null;
          message: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          employer_id: string;
          candidate_email?: string | null;
          title?: string;
          start_time: string;
          end_time: string;
          meet_link?: string | null;
          google_event_id?: string | null;
          message?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string;
          employer_id?: string;
          candidate_email?: string | null;
          title?: string;
          start_time?: string;
          end_time?: string;
          meet_link?: string | null;
          google_event_id?: string | null;
          message?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      interview_slots: {
        Row: {
          id: string;
          job_id: string;
          employer_id: string;
          start_time: string;
          end_time: string;
          is_booked: boolean | null;
          booked_by: string | null;
          application_id: string | null;
          meeting_link: string | null;
          calendar_event_id: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          employer_id?: string;
          start_time: string;
          end_time: string;
          is_booked?: boolean | null;
          booked_by?: string | null;
          application_id?: string | null;
          meeting_link?: string | null;
          calendar_event_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          employer_id?: string;
          start_time?: string;
          end_time?: string;
          is_booked?: boolean | null;
          booked_by?: string | null;
          application_id?: string | null;
          meeting_link?: string | null;
          calendar_event_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          application_id: string;
          scheduled_at: string;
          duration_minutes: number | null;
          location: string | null;
          meeting_link: string | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
          employer_id: string | null;
          candidate_id: string | null;
          candidate_email: string | null;
          title: string | null;
          message: string | null;
          accepted_at: string | null;
          declined_at: string | null;
          google_event_id: string | null;
          meet_link: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          scheduled_at: string;
          duration_minutes?: number | null;
          location?: string | null;
          meeting_link?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          employer_id?: string | null;
          candidate_id?: string | null;
          candidate_email?: string | null;
          title?: string | null;
          message?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          google_event_id?: string | null;
          meet_link?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string;
          scheduled_at?: string;
          duration_minutes?: number | null;
          location?: string | null;
          meeting_link?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          employer_id?: string | null;
          candidate_id?: string | null;
          candidate_email?: string | null;
          title?: string | null;
          message?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          google_event_id?: string | null;
          meet_link?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      job_matches: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          match_score: string | null;
          match_reasons: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id?: string;
          match_score?: string | null;
          match_reasons?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          user_id?: string;
          match_score?: string | null;
          match_reasons?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          posted_by: string;
          title: string;
          description: string;
          requirements: string | null;
          skills: string[];
          location: string | null;
          job_type: Database["public"]["Enums"]["job_type"];
          experience_level: Database["public"]["Enums"]["experience_level"];
          salary_min: number | null;
          salary_max: number | null;
          currency: string | null;
          status: Database["public"]["Enums"]["job_status"];
          created_at: string;
          updated_at: string;
          employer_id: string | null;
          responsibilities: Json | null;
          skills_required: Json | null;
          technologies: Json | null;
          job_category: string | null;
          is_remote: boolean | null;
          industry: string | null;
          keywords: Json | null;
          applications_count: number | null;
          views_count: number | null;
          salary_min_usd: number | null;
          salary_max_usd: number | null;
          employment_type: string | null;
          requirements_list: Json | null;
          is_featured: boolean | null;
          featured_until: string | null;
          benefits: string | null;
          required_skills: string[] | null;
          slug: string | null;
          salary_currency: string | null;
          category_id: string | null;
          application_deadline: string | null;
          responsibilities_text: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          posted_by: string;
          title: string;
          description: string;
          requirements?: string | null;
          skills?: string[];
          location?: string | null;
          job_type?: Database["public"]["Enums"]["job_type"];
          experience_level?: Database["public"]["Enums"]["experience_level"];
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          created_at?: string;
          updated_at?: string;
          employer_id?: string | null;
          responsibilities?: Json | null;
          skills_required?: Json | null;
          technologies?: Json | null;
          job_category?: string | null;
          is_remote?: boolean | null;
          industry?: string | null;
          keywords?: Json | null;
          applications_count?: number | null;
          views_count?: number | null;
          salary_min_usd?: number | null;
          salary_max_usd?: number | null;
          employment_type?: string | null;
          requirements_list?: Json | null;
          is_featured?: boolean | null;
          featured_until?: string | null;
          benefits?: string | null;
          required_skills?: string[] | null;
          slug?: string | null;
          salary_currency?: string | null;
          category_id?: string | null;
          application_deadline?: string | null;
          responsibilities_text?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          posted_by?: string;
          title?: string;
          description?: string;
          requirements?: string | null;
          skills?: string[];
          location?: string | null;
          job_type?: Database["public"]["Enums"]["job_type"];
          experience_level?: Database["public"]["Enums"]["experience_level"];
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          created_at?: string;
          updated_at?: string;
          employer_id?: string | null;
          responsibilities?: Json | null;
          skills_required?: Json | null;
          technologies?: Json | null;
          job_category?: string | null;
          is_remote?: boolean | null;
          industry?: string | null;
          keywords?: Json | null;
          applications_count?: number | null;
          views_count?: number | null;
          salary_min_usd?: number | null;
          salary_max_usd?: number | null;
          employment_type?: string | null;
          requirements_list?: Json | null;
          is_featured?: boolean | null;
          featured_until?: string | null;
          benefits?: string | null;
          required_skills?: string[] | null;
          slug?: string | null;
          salary_currency?: string | null;
          category_id?: string | null;
          application_deadline?: string | null;
          responsibilities_text?: string | null;
        };
        Relationships: [];
      };
      learning_courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          provider: string | null;
          url: string | null;
          skills: string[] | null;
          kind: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          provider?: string | null;
          url?: string | null;
          skills?: string[] | null;
          kind?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          provider?: string | null;
          url?: string | null;
          skills?: string[] | null;
          kind?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          progress: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          item_id: string;
          progress?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          progress?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          application_id: string;
          candidate_id: string | null;
          scheduled_by: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          duration_minutes: number | null;
          meeting_url: string | null;
          google_event_id: string | null;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          candidate_id?: string | null;
          scheduled_by: string;
          title?: string;
          description?: string | null;
          scheduled_at: string;
          duration_minutes?: number | null;
          meeting_url?: string | null;
          google_event_id?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string;
          candidate_id?: string | null;
          scheduled_by?: string;
          title?: string;
          description?: string | null;
          scheduled_at?: string;
          duration_minutes?: number | null;
          meeting_url?: string | null;
          google_event_id?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string | null;
          job_id: string | null;
          subject: string | null;
          body: string | null;
          is_read: boolean | null;
          created_at: string | null;
          conversation_id: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_type: string | null;
          read_at: string | null;
          chat_id: string | null;
        };
        Insert: {
          id?: string;
          sender_id?: string;
          receiver_id?: string | null;
          job_id?: string | null;
          subject?: string | null;
          body?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
          conversation_id?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_type?: string | null;
          read_at?: string | null;
          chat_id?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string | null;
          job_id?: string | null;
          subject?: string | null;
          body?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
          conversation_id?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_type?: string | null;
          read_at?: string | null;
          chat_id?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          data: Json | null;
          is_read: boolean | null;
          created_at: string | null;
          link: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: string;
          title: string;
          message?: string | null;
          data?: Json | null;
          is_read?: boolean | null;
          created_at?: string | null;
          link?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          data?: Json | null;
          is_read?: boolean | null;
          created_at?: string | null;
          link?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: string | null;
          currency: string | null;
          status: string | null;
          stripe_session_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount?: string | null;
          currency?: string | null;
          status?: string | null;
          stripe_session_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: string | null;
          currency?: string | null;
          status?: string | null;
          stripe_session_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string | null;
          parent_id: string | null;
          created_at: string | null;
          content: string | null;
          likes_count: number | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id?: string;
          body?: string | null;
          parent_id?: string | null;
          created_at?: string | null;
          content?: string | null;
          likes_count?: number | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          body?: string | null;
          parent_id?: string | null;
          created_at?: string | null;
          content?: string | null;
          likes_count?: number | null;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      post_reports: {
        Row: {
          id: string;
          post_id: string;
          reporter_id: string;
          reason: string;
          details: string | null;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          reporter_id?: string;
          reason: string;
          details?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          reporter_id?: string;
          reason?: string;
          details?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      post_saves: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: string;
          title: string | null;
          body: string | null;
          media_urls: Json | null;
          tags: Json | null;
          blog_content: string | null;
          likes_count: number | null;
          comments_count: number | null;
          shares_count: number | null;
          views_count: number | null;
          is_published: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          content: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          author_id?: string;
          type?: string;
          title?: string | null;
          body?: string | null;
          media_urls?: Json | null;
          tags?: Json | null;
          blog_content?: string | null;
          likes_count?: number | null;
          comments_count?: number | null;
          shares_count?: number | null;
          views_count?: number | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          content?: string | null;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          type?: string;
          title?: string | null;
          body?: string | null;
          media_urls?: Json | null;
          tags?: Json | null;
          blog_content?: string | null;
          likes_count?: number | null;
          comments_count?: number | null;
          shares_count?: number | null;
          views_count?: number | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          content?: string | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          headline: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
          user_role: string;
          current_position: string | null;
          years_experience: number | null;
          current_company: string | null;
          preferred_location: string | null;
          remote_preference: string | null;
          expected_salary_usd: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          portfolio_url: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          skills: Json | null;
          technologies: Json | null;
          languages: Json | null;
          education: Json | null;
          experience: Json | null;
          projects: Json | null;
          certifications: Json | null;
          cover_letter: string | null;
          availability: string | null;
          notice_period: string | null;
          employment_type_preference: string | null;
          job_type_preference: Json | null;
          industry_preference: Json | null;
          profile_completion: number | null;
          profile_visibility: string | null;
          public_url: string | null;
          is_admin: boolean | null;
          banner_url: string | null;
          followers_count: number | null;
          following_count: number | null;
          recommendations: Json | null;
          volunteer_experience: Json | null;
          awards: Json | null;
          interests: Json | null;
          is_premium: boolean | null;
          premium_expires_at: string | null;
          linkedin_imported: boolean | null;
          github_username: string | null;
          referral_code: string | null;
          about: string | null;
          experience_years: number | null;
          expected_salary: number | null;
          preferred_job_type: string | null;
          onboarding_completed: boolean | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          headline?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          user_role?: string;
          current_position?: string | null;
          years_experience?: number | null;
          current_company?: string | null;
          preferred_location?: string | null;
          remote_preference?: string | null;
          expected_salary_usd?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          skills?: Json | null;
          technologies?: Json | null;
          languages?: Json | null;
          education?: Json | null;
          experience?: Json | null;
          projects?: Json | null;
          certifications?: Json | null;
          cover_letter?: string | null;
          availability?: string | null;
          notice_period?: string | null;
          employment_type_preference?: string | null;
          job_type_preference?: Json | null;
          industry_preference?: Json | null;
          profile_completion?: number | null;
          profile_visibility?: string | null;
          public_url?: string | null;
          is_admin?: boolean | null;
          banner_url?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          recommendations?: Json | null;
          volunteer_experience?: Json | null;
          awards?: Json | null;
          interests?: Json | null;
          is_premium?: boolean | null;
          premium_expires_at?: string | null;
          linkedin_imported?: boolean | null;
          github_username?: string | null;
          referral_code?: string | null;
          about?: string | null;
          experience_years?: number | null;
          expected_salary?: number | null;
          preferred_job_type?: string | null;
          onboarding_completed?: boolean | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          headline?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          user_role?: string;
          current_position?: string | null;
          years_experience?: number | null;
          current_company?: string | null;
          preferred_location?: string | null;
          remote_preference?: string | null;
          expected_salary_usd?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          skills?: Json | null;
          technologies?: Json | null;
          languages?: Json | null;
          education?: Json | null;
          experience?: Json | null;
          projects?: Json | null;
          certifications?: Json | null;
          cover_letter?: string | null;
          availability?: string | null;
          notice_period?: string | null;
          employment_type_preference?: string | null;
          job_type_preference?: Json | null;
          industry_preference?: Json | null;
          profile_completion?: number | null;
          profile_visibility?: string | null;
          public_url?: string | null;
          is_admin?: boolean | null;
          banner_url?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          recommendations?: Json | null;
          volunteer_experience?: Json | null;
          awards?: Json | null;
          interests?: Json | null;
          is_premium?: boolean | null;
          premium_expires_at?: string | null;
          linkedin_imported?: boolean | null;
          github_username?: string | null;
          referral_code?: string | null;
          about?: string | null;
          experience_years?: number | null;
          expected_salary?: number | null;
          preferred_job_type?: string | null;
          onboarding_completed?: boolean | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          code: string;
          referrer_id: string;
          referred_email: string;
          referred_user_id: string | null;
          reward_credits: number | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          referrer_id: string;
          referred_email: string;
          referred_user_id?: string | null;
          reward_credits?: number | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          referrer_id?: string;
          referred_email?: string;
          referred_user_id?: string | null;
          reward_credits?: number | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          details: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id?: string;
          target_type: string;
          target_id: string;
          reason: string;
          details?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: string;
          target_id?: string;
          reason?: string;
          details?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          mime_type: string | null;
          title: string | null;
          resume_data: Json | null;
          parsed_data: Json | null;
          overall_score: number | null;
          ats_score: number | null;
          keyword_score: number | null;
          grammar_score: number | null;
          formatting_score: number | null;
          professionalism_score: number | null;
          suggestions: Json | null;
          is_default: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          career_roadmap: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          title?: string | null;
          resume_data?: Json | null;
          parsed_data?: Json | null;
          overall_score?: number | null;
          ats_score?: number | null;
          keyword_score?: number | null;
          grammar_score?: number | null;
          formatting_score?: number | null;
          professionalism_score?: number | null;
          suggestions?: Json | null;
          is_default?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          career_roadmap?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          title?: string | null;
          resume_data?: Json | null;
          parsed_data?: Json | null;
          overall_score?: number | null;
          ats_score?: number | null;
          keyword_score?: number | null;
          grammar_score?: number | null;
          formatting_score?: number | null;
          professionalism_score?: number | null;
          suggestions?: Json | null;
          is_default?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          career_roadmap?: Json | null;
        };
        Relationships: [];
      };
      review_replies: {
        Row: {
          id: string;
          review_id: string;
          author_id: string;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          review_id: string;
          author_id: string;
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          review_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          company_id: string;
          reviewer_id: string;
          rating: number;
          title: string;
          body: string | null;
          pros: string | null;
          cons: string | null;
          is_current_employee: boolean | null;
          job_title: string | null;
          created_at: string | null;
          updated_at: string | null;
          content: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          reviewer_id?: string;
          rating: number;
          title: string;
          body?: string | null;
          pros?: string | null;
          cons?: string | null;
          is_current_employee?: boolean | null;
          job_title?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          content?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          reviewer_id?: string;
          rating?: number;
          title?: string;
          body?: string | null;
          pros?: string | null;
          cons?: string | null;
          is_current_employee?: boolean | null;
          job_title?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          content?: string | null;
        };
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          job_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          subject: string;
          message: string;
          admin_reply: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          subject: string;
          message: string;
          admin_reply?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          subject?: string;
          message?: string;
          admin_reply?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_notification: {
        Args: {
          _user_id: string;
          _type: string;
          _title: string;
          _message: string;
          _link: string;
          _metadata: Json;
        };
        Returns: string;
      };
      get_assessment_questions: {
        Args: {
          _assessment_id: string;
        };
        Returns: Json;
      };
      get_or_create_chat: {
        Args: {
          _user_a: string;
          _user_b: string;
        };
        Returns: string;
      };
      get_user_role: {
        Args: {
          _user_id: string;
        };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: {
          _user_id: string;
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
      submit_assessment: {
        Args: {
          _assessment_id: string;
          _answers: Json;
        };
        Returns: {
          passed: boolean;
          score: number;
        }[];
      };
      update_application_status: {
        Args: {
          _application_id: string;
          _new_status: Database["public"]["Enums"]["application_status"];
          _actor_id: string;
          _note: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "job_seeker" | "seeker" | "employer" | "admin";
      application_status:
        | "applied"
        | "viewed"
        | "reviewing"
        | "shortlisted"
        | "interview"
        | "interview_scheduled"
        | "interview_completed"
        | "selected"
        | "rejected"
        | "offer"
        | "withdrawn";
      experience_level: "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
      job_status: "draft" | "published" | "closed" | "active" | "paused";
      job_type: "full_time" | "part_time" | "contract" | "internship" | "remote" | "freelance";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string;
          name: string;
          owner: string | null;
          created_at: string | null;
          updated_at: string | null;
          public: boolean | null;
          file_size_limit: number | null;
          allowed_mime_types: string[] | null;
          owner_id: string | null;
        };
        Insert: {
          id: string;
          name: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          public?: boolean | null;
          file_size_limit?: number | null;
          allowed_mime_types?: string[] | null;
          owner_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          public?: boolean | null;
          file_size_limit?: number | null;
          allowed_mime_types?: string[] | null;
          owner_id?: string | null;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          id: string;
          bucket_id: string;
          name: string;
          owner: string | null;
          created_at: string | null;
          updated_at: string | null;
          last_accessed_at: string | null;
          metadata: Json | null;
          path_tokens: string[] | null;
          owner_id: string | null;
          version: string | null;
        };
        Insert: {
          id?: string;
          bucket_id: string;
          name: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          path_tokens?: string[] | null;
          owner_id?: string | null;
          version?: string | null;
        };
        Update: {
          id?: string;
          bucket_id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          path_tokens?: string[] | null;
          owner_id?: string | null;
          version?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      folder: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      get_size_by_bucket: {
        Args: Record<string, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchema extends keyof Database = "public",
  SchemaOverrides extends { [K in DefaultSchema]?: Database[K] } = {},
> = (
  SchemaOverrides[DefaultSchema] extends {
    Tables: infer T;
  }
    ? T
    : DefaultSchema extends keyof Database
      ? Database[DefaultSchema]["Tables"]
      : never
) extends infer T
  ? T extends Record<string, any>
    ? T[keyof T]
    : never
  : never;

export type TablesInsert<
  DefaultSchema extends keyof Database = "public",
  SchemaOverrides extends { [K in DefaultSchema]?: Database[K] } = {},
> = (
  SchemaOverrides[DefaultSchema] extends {
    Tables: infer T;
  }
    ? T
    : DefaultSchema extends keyof Database
      ? Database[DefaultSchema]["Tables"]
      : never
) extends infer T
  ? T extends Record<string, any>
    ? T[keyof T]["Insert"]
    : never
  : never;

export type TablesUpdate<
  DefaultSchema extends keyof Database = "public",
  SchemaOverrides extends { [K in DefaultSchema]?: Database[K] } = {},
> = (
  SchemaOverrides[DefaultSchema] extends {
    Tables: infer T;
  }
    ? T
    : DefaultSchema extends keyof Database
      ? Database[DefaultSchema]["Tables"]
      : never
) extends infer T
  ? T extends Record<string, any>
    ? T[keyof T]["Update"]
    : never
  : never;

export type Enums<
  DefaultSchema extends keyof Database = "public",
  SchemaOverrides extends { [K in DefaultSchema]?: Database[K] } = {},
> = (
  SchemaOverrides[DefaultSchema] extends {
    Enums: infer E;
  }
    ? E
    : DefaultSchema extends keyof Database
      ? Database[DefaultSchema]["Enums"]
      : never
) extends infer E
  ? E extends Record<string, any>
    ? E[keyof E]
    : never
  : never;

export type CompositeTypes<
  DefaultSchema extends keyof Database = "public",
  SchemaOverrides extends { [K in DefaultSchema]?: Database[K] } = {},
> = (
  SchemaOverrides[DefaultSchema] extends {
    CompositeTypes: infer C;
  }
    ? C
    : DefaultSchema extends keyof Database
      ? Database[DefaultSchema]["CompositeTypes"]
      : never
) extends infer C
  ? C extends Record<string, any>
    ? C[keyof C]
    : never
  : never;

export type Constants<
  PublicSchemaOrSchemaOptions extends
    keyof Database | Record<string, { Enums: Record<string, any> }> = "public",
  SchemaOptions extends { [K in keyof Database]?: { Enums: Record<string, any> } } = {},
> = {
  [
    Schema in Extract<PublicSchemaOrSchemaOptions, keyof Database>
  ]: Database[Schema]["Enums"] extends infer E
    ? E extends Record<string, any>
      ? {
          [K in keyof E]: E[K] extends string
            ? {
                [V in E[K]]: V;
              }
            : never;
        }
      : never
    : never;
};

type InternalSupabase = {
  PostgrestVersion: "14.5";
  Feature: {
    [
      K in
        | "schemas"
        | "deletableTableColumns"
        | "insertableTableColumns"
        | "updatableTableColumns"
        | "updatableViews"
        | "scalarArraysToJsArrays"
        | "returningMinimalRelationColumnNames"
        | "returningMinimalTableColumnNames"
        | "overloadedFunctionArgs"
        | "emptyStringToNull"
        | "computedColumns"
        | "pgVector"
        | "jsonbNumericToJsNumber"
    ]: boolean;
  };
};

declare const __InternalSupabase: InternalSupabase;
