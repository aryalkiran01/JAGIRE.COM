export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      application_events: {
        Row: {
          actor_id: string | null;
          application_id: string;
          created_at: string;
          id: string;
          note: string | null;
          status: Database["public"]["Enums"]["application_status"];
        };
        Insert: {
          actor_id?: string | null;
          application_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          status: Database["public"]["Enums"]["application_status"];
        };
        Update: {
          actor_id?: string | null;
          application_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
        };
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          applicant_id: string;
          applied_at: string;
          cover_letter: string | null;
          employer_notes: string | null;
          id: string;
          job_id: string;
          match_score: number | null;
          resume_id: string | null;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
        };
        Insert: {
          applicant_id: string;
          applied_at?: string;
          cover_letter?: string | null;
          employer_notes?: string | null;
          id?: string;
          job_id: string;
          match_score?: number | null;
          resume_id?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Update: {
          applicant_id?: string;
          applied_at?: string;
          cover_letter?: string | null;
          employer_notes?: string | null;
          id?: string;
          job_id?: string;
          match_score?: number | null;
          resume_id?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_resume_id_fkey";
            columns: ["resume_id"];
            isOneToOne: false;
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_attempts: {
        Row: {
          answers: Json;
          assessment_id: string;
          created_at: string;
          id: string;
          passed: boolean;
          score: number;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          assessment_id: string;
          created_at?: string;
          id?: string;
          passed?: boolean;
          score?: number;
          user_id: string;
        };
        Update: {
          answers?: Json;
          assessment_id?: string;
          created_at?: string;
          id?: string;
          passed?: boolean;
          score?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments_catalog";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          category: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          difficulty: string | null;
          duration_minutes: number | null;
          id: string;
          passing_score: number;
          questions: Json;
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          id?: string;
          passing_score?: number;
          questions?: Json;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          id?: string;
          passing_score?: number;
          questions?: Json;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      blogs: {
        Row: {
          author_id: string;
          content: string;
          cover_url: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          published: boolean;
          published_at: string | null;
          slug: string;
          tags: string[] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          content: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published?: boolean;
          published_at?: string | null;
          slug: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published?: boolean;
          published_at?: string | null;
          slug?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string | null;
          user_a: string;
          user_b: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          user_a: string;
          user_b: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          benefits: string[] | null;
          cover_url: string | null;
          created_at: string;
          culture: string | null;
          description: string | null;
          facebook_url: string | null;
          founded_year: number | null;
          headquarters: string | null;
          hiring_process: string | null;
          id: string;
          industry: string | null;
          locations: string[] | null;
          logo_url: string | null;
          mission: string | null;
          name: string;
          owner_id: string;
          size: string | null;
          slug: string;
          tagline: string | null;
          technologies: string[] | null;
          twitter_url: string | null;
          updated_at: string;
          verified: boolean;
          vision: string | null;
          website: string | null;
        };
        Insert: {
          benefits?: string[] | null;
          cover_url?: string | null;
          created_at?: string;
          culture?: string | null;
          description?: string | null;
          facebook_url?: string | null;
          founded_year?: number | null;
          headquarters?: string | null;
          hiring_process?: string | null;
          id?: string;
          industry?: string | null;
          locations?: string[] | null;
          logo_url?: string | null;
          mission?: string | null;
          name: string;
          owner_id: string;
          size?: string | null;
          slug: string;
          tagline?: string | null;
          technologies?: string[] | null;
          twitter_url?: string | null;
          updated_at?: string;
          verified?: boolean;
          vision?: string | null;
          website?: string | null;
        };
        Update: {
          benefits?: string[] | null;
          cover_url?: string | null;
          created_at?: string;
          culture?: string | null;
          description?: string | null;
          facebook_url?: string | null;
          founded_year?: number | null;
          headquarters?: string | null;
          hiring_process?: string | null;
          id?: string;
          industry?: string | null;
          locations?: string[] | null;
          logo_url?: string | null;
          mission?: string | null;
          name?: string;
          owner_id?: string;
          size?: string | null;
          slug?: string;
          tagline?: string | null;
          technologies?: string[] | null;
          twitter_url?: string | null;
          updated_at?: string;
          verified?: boolean;
          vision?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      interview_events: {
        Row: {
          application_id: string;
          candidate_email: string;
          created_at: string;
          employer_id: string;
          end_time: string;
          google_event_id: string | null;
          id: string;
          meet_link: string | null;
          start_time: string;
          title: string;
        };
        Insert: {
          application_id: string;
          candidate_email: string;
          created_at?: string;
          employer_id: string;
          end_time: string;
          google_event_id?: string | null;
          id?: string;
          meet_link?: string | null;
          start_time: string;
          title: string;
        };
        Update: {
          application_id?: string;
          candidate_email?: string;
          created_at?: string;
          employer_id?: string;
          end_time?: string;
          google_event_id?: string | null;
          id?: string;
          meet_link?: string | null;
          start_time?: string;
          title?: string;
        };
        Relationships: [];
      };
      interview_slots: {
        Row: {
          application_id: string | null;
          created_at: string;
          employer_id: string;
          ends_at: string;
          id: string;
          meet_url: string | null;
          starts_at: string;
          taken_by: string | null;
        };
        Insert: {
          application_id?: string | null;
          created_at?: string;
          employer_id: string;
          ends_at: string;
          id?: string;
          meet_url?: string | null;
          starts_at: string;
          taken_by?: string | null;
        };
        Update: {
          application_id?: string | null;
          created_at?: string;
          employer_id?: string;
          ends_at?: string;
          id?: string;
          meet_url?: string | null;
          starts_at?: string;
          taken_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interview_slots_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          application_deadline: string | null;
          applications_count: number | null;
          benefits: string | null;
          category_id: string | null;
          company_id: string;
          created_at: string;
          description: string;
          experience_level: Database["public"]["Enums"]["experience_level"];
          id: string;
          is_remote: boolean | null;
          job_type: Database["public"]["Enums"]["job_type"];
          location: string | null;
          posted_by: string;
          required_skills: string[] | null;
          requirements: string | null;
          responsibilities: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          slug: string;
          status: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at: string;
          views_count: number | null;
        };
        Insert: {
          application_deadline?: string | null;
          applications_count?: number | null;
          benefits?: string | null;
          category_id?: string | null;
          company_id: string;
          created_at?: string;
          description: string;
          experience_level?: Database["public"]["Enums"]["experience_level"];
          id?: string;
          is_remote?: boolean | null;
          job_type?: Database["public"]["Enums"]["job_type"];
          location?: string | null;
          posted_by: string;
          required_skills?: string[] | null;
          requirements?: string | null;
          responsibilities?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          slug: string;
          status?: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at?: string;
          views_count?: number | null;
        };
        Update: {
          application_deadline?: string | null;
          applications_count?: number | null;
          benefits?: string | null;
          category_id?: string | null;
          company_id?: string;
          created_at?: string;
          description?: string;
          experience_level?: Database["public"]["Enums"]["experience_level"];
          id?: string;
          is_remote?: boolean | null;
          job_type?: Database["public"]["Enums"]["job_type"];
          location?: string | null;
          posted_by?: string;
          required_skills?: string[] | null;
          requirements?: string | null;
          responsibilities?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          slug?: string;
          status?: Database["public"]["Enums"]["job_status"];
          title?: string;
          updated_at?: string;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          kind: string;
          provider: string | null;
          skills: string[];
          title: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          kind: string;
          provider?: string | null;
          skills?: string[];
          title: string;
          url: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          kind?: string;
          provider?: string | null;
          skills?: string[];
          title?: string;
          url?: string;
        };
        Relationships: [];
      };
      learning_progress: {
        Row: {
          id: string;
          item_id: string;
          progress: number;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          progress?: number;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          progress?: number;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_progress_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "learning_items";
            referencedColumns: ["id"];
          },
        ];
      };
      meetings: {
        Row: {
          application_id: string;
          candidate_id: string;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          google_event_id: string | null;
          id: string;
          meeting_url: string | null;
          scheduled_at: string;
          scheduled_by: string;
          status: Database["public"]["Enums"]["meeting_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          application_id: string;
          candidate_id: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          google_event_id?: string | null;
          id?: string;
          meeting_url?: string | null;
          scheduled_at: string;
          scheduled_by: string;
          status?: Database["public"]["Enums"]["meeting_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          candidate_id?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          google_event_id?: string | null;
          id?: string;
          meeting_url?: string | null;
          scheduled_at?: string;
          scheduled_by?: string;
          status?: Database["public"]["Enums"]["meeting_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          attachment_type: string | null;
          attachment_url: string | null;
          body: string | null;
          chat_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          attachment_type?: string | null;
          attachment_url?: string | null;
          body?: string | null;
          chat_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          attachment_type?: string | null;
          attachment_url?: string | null;
          body?: string | null;
          chat_id?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          metadata: Json | null;
          is_read: boolean;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          metadata?: Json | null;
          read?: boolean;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          metadata?: Json | null;
          read?: boolean;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          post_id: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          id?: string;
          post_id: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_saves: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          comments_count: number;
          content: string;
          created_at: string;
          id: string;
          image_url: string | null;
          likes_count: number;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          comments_count?: number;
          content: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          likes_count?: number;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          comments_count?: number;
          content?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          likes_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_skills: {
        Row: {
          proficiency: number | null;
          profile_id: string;
          skill_id: string;
        };
        Insert: {
          proficiency?: number | null;
          profile_id: string;
          skill_id: string;
        };
        Update: {
          proficiency?: number | null;
          profile_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          about: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
          certifications: Json;
          created_at: string;
          current_position: string | null;
          education: Json;
          email: string | null;
          expected_salary: number | null;
          experience: Json;
          experience_years: number | null;
          full_name: string | null;
          github_url: string | null;
          github_username: string | null;
          headline: string | null;
          id: string;
          languages: string[] | null;
          linkedin_url: string | null;
          location: string | null;
          onboarding_completed: boolean | null;
          phone: string | null;
          preferred_job_type: Database["public"]["Enums"]["job_type"] | null;
          preferred_location: string | null;
          projects: Json;
          referral_code: string | null;
          skills: string[];
          updated_at: string;
          website: string | null;
        };
        Insert: {
          about?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          certifications?: Json;
          created_at?: string;
          current_position?: string | null;
          education?: Json;
          email?: string | null;
          expected_salary?: number | null;
          experience?: Json;
          experience_years?: number | null;
          full_name?: string | null;
          github_url?: string | null;
          github_username?: string | null;
          headline?: string | null;
          id: string;
          languages?: string[] | null;
          linkedin_url?: string | null;
          location?: string | null;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          preferred_job_type?: Database["public"]["Enums"]["job_type"] | null;
          preferred_location?: string | null;
          projects?: Json;
          referral_code?: string | null;
          skills?: string[];
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          about?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          certifications?: Json;
          created_at?: string;
          current_position?: string | null;
          education?: Json;
          email?: string | null;
          expected_salary?: number | null;
          experience?: Json;
          experience_years?: number | null;
          full_name?: string | null;
          github_url?: string | null;
          github_username?: string | null;
          headline?: string | null;
          id?: string;
          languages?: string[] | null;
          linkedin_url?: string | null;
          location?: string | null;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          preferred_job_type?: Database["public"]["Enums"]["job_type"] | null;
          preferred_location?: string | null;
          projects?: Json;
          referral_code?: string | null;
          skills?: string[];
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          referred_email: string;
          referred_user_id: string | null;
          referrer_id: string;
          reward_credits: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          referred_email: string;
          referred_user_id?: string | null;
          referrer_id: string;
          reward_credits?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          referred_email?: string;
          referred_user_id?: string | null;
          referrer_id?: string;
          reward_credits?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          ats_score: number | null;
          created_at: string;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          formatting_score: number | null;
          grammar_score: number | null;
          id: string;
          is_default: boolean | null;
          keyword_score: number | null;
          mime_type: string | null;
          overall_score: number | null;
          parsed_data: Json | null;
          professionalism_score: number | null;
          resume_data: Json | null;
          suggestions: Json | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ats_score?: number | null;
          created_at?: string;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          formatting_score?: number | null;
          grammar_score?: number | null;
          id?: string;
          is_default?: boolean | null;
          keyword_score?: number | null;
          mime_type?: string | null;
          overall_score?: number | null;
          parsed_data?: Json | null;
          professionalism_score?: number | null;
          resume_data?: Json | null;
          suggestions?: Json | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ats_score?: number | null;
          created_at?: string;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          formatting_score?: number | null;
          grammar_score?: number | null;
          id?: string;
          is_default?: boolean | null;
          keyword_score?: number | null;
          mime_type?: string | null;
          overall_score?: number | null;
          parsed_data?: Json | null;
          professionalism_score?: number | null;
          resume_data?: Json | null;
          suggestions?: Json | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      review_replies: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          review_id: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          id?: string;
          review_id: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          review_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          company_id: string;
          content: string | null;
          created_at: string;
          id: string;
          rating: number;
          reviewer_id: string;
          title: string | null;
        };
        Insert: {
          company_id: string;
          content?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          reviewer_id: string;
          title?: string | null;
        };
        Update: {
          company_id?: string;
          content?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          reviewer_id?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_jobs: {
        Row: {
          created_at: string;
          job_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          job_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          job_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          category: string | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          admin_reply: string | null;
          created_at: string;
          id: string;
          message: string;
          status: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_reply?: string | null;
          created_at?: string;
          id?: string;
          message: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_reply?: string | null;
          created_at?: string;
          id?: string;
          message?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      assessments_catalog: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          difficulty: string | null;
          duration_minutes: number | null;
          id: string | null;
          passing_score: number | null;
          question_count: number | null;
          title: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          id?: string | null;
          passing_score?: number | null;
          question_count?: never;
          title?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          id?: string | null;
          passing_score?: number | null;
          question_count?: never;
          title?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_assessment_questions: {
        Args: { _assessment_id: string };
        Returns: Json;
      };
      get_user_role: {
        Args: { _user_id: string };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      submit_assessment: {
        Args: { _answers: Json; _assessment_id: string };
        Returns: {
          passed: boolean;
          score: number;
        }[];
      };
    };
    Enums: {
      app_role: "job_seeker" | "employer" | "admin";
      application_status:
        "applied" | "viewed" | "shortlisted" | "interview" | "selected" | "rejected" | "withdrawn";
      experience_level: "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
      job_status: "draft" | "active" | "published" | "paused" | "closed";
      job_type: "full_time" | "part_time" | "contract" | "internship" | "freelance";
      meeting_status: "scheduled" | "completed" | "cancelled" | "no_show";
      notification_type: "application" | "message" | "interview" | "job_match" | "system";
      ticket_status: "open" | "in_progress" | "resolved" | "closed";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["job_seeker", "employer", "admin"],
      application_status: [
        "applied",
        "viewed",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
        "withdrawn",
      ],
      experience_level: ["entry", "junior", "mid", "senior", "lead", "executive"],
      job_status: ["draft", "active", "paused", "closed"],
      job_type: ["full_time", "part_time", "contract", "internship", "freelance"],
      meeting_status: ["scheduled", "completed", "cancelled", "no_show"],
      notification_type: ["application", "message", "interview", "job_match", "system"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const;
