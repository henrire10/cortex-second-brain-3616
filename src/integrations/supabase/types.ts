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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          points_reward: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
          points_reward?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          points_reward?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          abdomen: number | null
          body_fat: number | null
          chest: number | null
          created_at: string
          date: string
          height: number | null
          hips: number | null
          id: string
          left_arm_flexed: number | null
          left_arm_relaxed: number | null
          left_calf: number | null
          left_forearm: number | null
          left_thigh_medial: number | null
          left_thigh_proximal: number | null
          measurement_unit: string | null
          muscle_mass: number | null
          neck: number | null
          notes: string | null
          right_arm_flexed: number | null
          right_arm_relaxed: number | null
          right_calf: number | null
          right_forearm: number | null
          right_thigh_medial: number | null
          right_thigh_proximal: number | null
          updated_at: string
          user_id: string
          waist_narrowest: number | null
          waist_navel: number | null
          weight: number | null
        }
        Insert: {
          abdomen?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          date?: string
          height?: number | null
          hips?: number | null
          id?: string
          left_arm_flexed?: number | null
          left_arm_relaxed?: number | null
          left_calf?: number | null
          left_forearm?: number | null
          left_thigh_medial?: number | null
          left_thigh_proximal?: number | null
          measurement_unit?: string | null
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          right_arm_flexed?: number | null
          right_arm_relaxed?: number | null
          right_calf?: number | null
          right_forearm?: number | null
          right_thigh_medial?: number | null
          right_thigh_proximal?: number | null
          updated_at?: string
          user_id: string
          waist_narrowest?: number | null
          waist_navel?: number | null
          weight?: number | null
        }
        Update: {
          abdomen?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          date?: string
          height?: number | null
          hips?: number | null
          id?: string
          left_arm_flexed?: number | null
          left_arm_relaxed?: number | null
          left_calf?: number | null
          left_forearm?: number | null
          left_thigh_medial?: number | null
          left_thigh_proximal?: number | null
          measurement_unit?: string | null
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          right_arm_flexed?: number | null
          right_arm_relaxed?: number | null
          right_calf?: number | null
          right_forearm?: number | null
          right_thigh_medial?: number | null
          right_thigh_proximal?: number | null
          updated_at?: string
          user_id?: string
          waist_narrowest?: number | null
          waist_navel?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      completed_exercises: {
        Row: {
          completed_at: string
          created_at: string
          exercise_name: string
          id: string
          user_id: string
          workout_date: string
          workout_title: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          exercise_name: string
          id?: string
          user_id: string
          workout_date: string
          workout_title: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          exercise_name?: string
          id?: string
          user_id?: string
          workout_date?: string
          workout_title?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string | null
          personal_trainer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          personal_trainer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          personal_trainer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_workouts: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          id: string
          personal_notes: string | null
          plan_id: string | null
          sent_at: string | null
          status: string
          timezone: string | null
          total_estimated_calories: number | null
          trainer_payout: number | null
          updated_at: string
          user_completion_payment: number | null
          user_id: string
          workout_content: string
          workout_date: string
          workout_title: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          personal_notes?: string | null
          plan_id?: string | null
          sent_at?: string | null
          status?: string
          timezone?: string | null
          total_estimated_calories?: number | null
          trainer_payout?: number | null
          updated_at?: string
          user_completion_payment?: number | null
          user_id: string
          workout_content: string
          workout_date: string
          workout_title: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          personal_notes?: string | null
          plan_id?: string | null
          sent_at?: string | null
          status?: string
          timezone?: string | null
          total_estimated_calories?: number | null
          trainer_payout?: number | null
          updated_at?: string
          user_completion_payment?: number | null
          user_id?: string
          workout_content?: string
          workout_date?: string
          workout_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans_approval"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_content: string
          message_type: string
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_content: string
          message_type?: string
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_content?: string
          message_type?: string
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_goals: {
        Row: {
          achieved: boolean | null
          achieved_date: string | null
          created_at: string
          current_value: number | null
          id: string
          measurement_type: string
          target_date: string | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved?: boolean | null
          achieved_date?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          measurement_type: string
          target_date?: string | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved?: boolean | null
          achieved_date?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          measurement_type?: string
          target_date?: string | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_paid: number | null
          created_at: string
          id: string
          points_used: number | null
          product_id: string
          purchase_method: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          id?: string
          points_used?: number | null
          product_id: string
          purchase_method: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          id?: string
          points_used?: number | null
          product_id?: string
          purchase_method?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      outdoor_activities: {
        Row: {
          avg_speed_kmh: number | null
          calories_burned: number | null
          created_at: string
          distance_km: number | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          route_path: Json | null
          start_time: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_speed_kmh?: number | null
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          route_path?: Json | null
          start_time: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_speed_kmh?: number | null
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          route_path?: Json | null
          start_time?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_points: number
          price_real: number
          price_real_monthly: number | null
          price_real_total: number | null
          product_type: string | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_points?: number
          price_real?: number
          price_real_monthly?: number | null
          price_real_total?: number | null
          product_type?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_points?: number
          price_real?: number
          price_real_monthly?: number | null
          price_real_total?: number | null
          product_type?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string | null
          available_equipment: string[] | null
          average_sleep_hours: number | null
          commitment_level: string | null
          cooking_skill: string | null
          cooking_time: string | null
          created_at: string
          current_workout_streak: number
          dietary_restrictions: string[] | null
          disliked_foods: string[] | null
          email: string | null
          exercise_preferences: string | null
          exercise_restrictions: string | null
          experience_level: string | null
          favorite_foods: string[] | null
          fitness_goal: string | null
          gender: string | null
          height: number | null
          id: string
          last_workout_date: string | null
          meals_per_day: number | null
          medical_conditions: string | null
          name: string
          other_restrictions: string | null
          payout_rate_per_review: number | null
          plan_id: string | null
          points: number
          profile_completed: boolean | null
          profile_data: Json | null
          profile_picture_url: string | null
          profile_status: Database["public"]["Enums"]["profile_status_enum"]
          questionnaire_completed: boolean | null
          session_duration: number | null
          sleep_quality: number | null
          specific_goal: string | null
          stress_level: number | null
          subscription_ends_at: string | null
          subscription_status: string | null
          supplements_interest: string[] | null
          updated_at: string
          user_id: string
          water_consumption: string | null
          weight: number | null
          workout_days_per_week: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          available_equipment?: string[] | null
          average_sleep_hours?: number | null
          commitment_level?: string | null
          cooking_skill?: string | null
          cooking_time?: string | null
          created_at?: string
          current_workout_streak?: number
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          email?: string | null
          exercise_preferences?: string | null
          exercise_restrictions?: string | null
          experience_level?: string | null
          favorite_foods?: string[] | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          id: string
          last_workout_date?: string | null
          meals_per_day?: number | null
          medical_conditions?: string | null
          name: string
          other_restrictions?: string | null
          payout_rate_per_review?: number | null
          plan_id?: string | null
          points?: number
          profile_completed?: boolean | null
          profile_data?: Json | null
          profile_picture_url?: string | null
          profile_status?: Database["public"]["Enums"]["profile_status_enum"]
          questionnaire_completed?: boolean | null
          session_duration?: number | null
          sleep_quality?: number | null
          specific_goal?: string | null
          stress_level?: number | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          supplements_interest?: string[] | null
          updated_at?: string
          user_id: string
          water_consumption?: string | null
          weight?: number | null
          workout_days_per_week?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          available_equipment?: string[] | null
          average_sleep_hours?: number | null
          commitment_level?: string | null
          cooking_skill?: string | null
          cooking_time?: string | null
          created_at?: string
          current_workout_streak?: number
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          email?: string | null
          exercise_preferences?: string | null
          exercise_restrictions?: string | null
          experience_level?: string | null
          favorite_foods?: string[] | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          last_workout_date?: string | null
          meals_per_day?: number | null
          medical_conditions?: string | null
          name?: string
          other_restrictions?: string | null
          payout_rate_per_review?: number | null
          plan_id?: string | null
          points?: number
          profile_completed?: boolean | null
          profile_data?: Json | null
          profile_picture_url?: string | null
          profile_status?: Database["public"]["Enums"]["profile_status_enum"]
          questionnaire_completed?: boolean | null
          session_duration?: number | null
          sleep_quality?: number | null
          specific_goal?: string | null
          stress_level?: number | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          supplements_interest?: string[] | null
          updated_at?: string
          user_id?: string
          water_consumption?: string | null
          weight?: number | null
          workout_days_per_week?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          measurement_id: string | null
          photo_type: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          measurement_id?: string | null
          photo_type: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          measurement_id?: string | null
          photo_type?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "body_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          expiration_time: string | null
          fcm_token: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          p256dh: string
          platform: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          expiration_time?: string | null
          fcm_token?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          p256dh: string
          platform?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          expiration_time?: string | null
          fcm_token?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          p256dh?: string
          platform?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questionnaire_debug_logs: {
        Row: {
          context: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          context?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          context?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          change_reason: string | null
          changed_by: string
          changed_user_id: string
          created_at: string | null
          id: string
          new_role: string
          old_role: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          changed_user_id: string
          created_at?: string | null
          id?: string
          new_role: string
          old_role?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          changed_user_id?: string
          created_at?: string | null
          id?: string
          new_role?: string
          old_role?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          log_level: string
          message: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_level?: string
          message: string
        }
        Update: {
          created_at?: string | null
          id?: string
          log_level?: string
          message?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      trainer_user_notes: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          importance: string | null
          is_reminder: boolean | null
          reminder_date: string | null
          title: string
          trainer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          importance?: string | null
          is_reminder?: boolean | null
          reminder_date?: string | null
          title: string
          trainer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          importance?: string | null
          is_reminder?: boolean | null
          reminder_date?: string | null
          title?: string
          trainer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_services: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_whatsapp: {
        Row: {
          created_at: string
          id: string
          opted_in: boolean
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opted_in?: boolean
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opted_in?: boolean
          phone_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_whatsapp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          id: string
          message_content: string
          message_type: string
          phone_number: string
          status: string | null
          user_id: string | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          message_type: string
          phone_number: string
          status?: string | null
          user_id?: string | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          message_type?: string
          phone_number?: string
          status?: string | null
          user_id?: string | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      whatsapp_schedule: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          send_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          send_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          send_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          created_at: string
          daily_workout_id: string | null
          exercise_name: string
          id: string
          logged_at: string
          reps_performed: number
          set_number: number
          updated_at: string
          user_id: string
          weight_lifted: number
          workout_date: string
        }
        Insert: {
          created_at?: string
          daily_workout_id?: string | null
          exercise_name: string
          id?: string
          logged_at?: string
          reps_performed: number
          set_number: number
          updated_at?: string
          user_id: string
          weight_lifted: number
          workout_date: string
        }
        Update: {
          created_at?: string
          daily_workout_id?: string | null
          exercise_name?: string
          id?: string
          logged_at?: string
          reps_performed?: number
          set_number?: number
          updated_at?: string
          user_id?: string
          weight_lifted?: number
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_daily_workout_id_fkey"
            columns: ["daily_workout_id"]
            isOneToOne: false
            referencedRelation: "daily_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_daily_workout_id_fkey"
            columns: ["daily_workout_id"]
            isOneToOne: false
            referencedRelation: "daily_workouts_brazil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_daily_workout_id_fkey"
            columns: ["daily_workout_id"]
            isOneToOne: false
            referencedRelation: "pending_workouts_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_daily_workout_id_fkey"
            columns: ["daily_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_pending_approval"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          difficulty: string
          estimated_calories: string | null
          goal: string
          id: string
          is_active: boolean
          plan_data: Json
          plan_duration_days: number | null
          plan_start_date: string | null
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          difficulty: string
          estimated_calories?: string | null
          goal: string
          id?: string
          is_active?: boolean
          plan_data: Json
          plan_duration_days?: number | null
          plan_start_date?: string | null
          updated_at?: string
          user_id: string
          week_number?: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          estimated_calories?: string | null
          goal?: string
          id?: string
          is_active?: boolean
          plan_data?: Json
          plan_duration_days?: number | null
          plan_start_date?: string | null
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      workout_plans_approval: {
        Row: {
          created_at: string
          id: string
          plan_data: Json | null
          plan_payout: number | null
          start_date: string
          status: string
          trainer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_data?: Json | null
          plan_payout?: number | null
          start_date?: string
          status?: string
          trainer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_data?: Json | null
          plan_payout?: number | null
          start_date?: string
          status?: string
          trainer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_approval_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_workouts_brazil: {
        Row: {
          completed_at: string | null
          completed_at_brazil: string | null
          created_at: string | null
          created_at_brazil: string | null
          id: string | null
          sent_at: string | null
          sent_at_brazil: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          updated_at_brazil: string | null
          user_id: string | null
          workout_content: string | null
          workout_date: string | null
          workout_title: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_at_brazil?: never
          created_at?: string | null
          created_at_brazil?: never
          id?: string | null
          sent_at?: string | null
          sent_at_brazil?: never
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_at_brazil?: never
          user_id?: string | null
          workout_content?: string | null
          workout_date?: string | null
          workout_title?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_at_brazil?: never
          created_at?: string | null
          created_at_brazil?: never
          id?: string | null
          sent_at?: string | null
          sent_at_brazil?: never
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_at_brazil?: never
          user_id?: string | null
          workout_content?: string | null
          workout_date?: string | null
          workout_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_workouts_with_profile: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          available_equipment: string[] | null
          average_sleep_hours: number | null
          commitment_level: string | null
          completed_at: string | null
          cooking_skill: string | null
          cooking_time: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          disliked_foods: string[] | null
          exercise_preferences: string | null
          exercise_restrictions: string | null
          experience_level: string | null
          favorite_foods: string[] | null
          fitness_goal: string | null
          gender: string | null
          height: number | null
          id: string | null
          meals_per_day: number | null
          medical_conditions: string | null
          other_restrictions: string | null
          personal_notes: string | null
          phone_number: string | null
          plan_id: string | null
          sent_at: string | null
          session_duration: number | null
          sleep_quality: number | null
          specific_goal: string | null
          status: string | null
          stress_level: number | null
          supplements_interest: string[] | null
          timezone: string | null
          total_estimated_calories: number | null
          trainer_payout: number | null
          updated_at: string | null
          user_completion_payment: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          water_consumption: string | null
          weight: number | null
          workout_content: string | null
          workout_date: string | null
          workout_days_per_week: number | null
          workout_title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans_approval"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts_pending_approval: {
        Row: {
          age: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          experience_level: string | null
          fitness_goal: string | null
          gender: string | null
          height: number | null
          id: string | null
          phone_number: string | null
          trainer_payout: number | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          weight: number | null
          workout_content: string | null
          workout_date: string | null
          workout_title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_workout_plan: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_cascata_completa: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_expansao_30_dias: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_only_plan_approval: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_simple_cascata: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_with_future_workouts: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_with_future_workouts_30_days: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      approve_workout_plan_with_future_workouts_30_days_fixed: {
        Args: { p_plan_id: string; p_trainer_id: string }
        Returns: Json
      }
      award_achievement_if_not_exists: {
        Args: { p_achievement_name: string; p_user_id: string }
        Returns: undefined
      }
      brazil_current_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      brazil_current_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      change_user_role: {
        Args: {
          p_new_role: string
          p_reason?: string
          p_target_user_id: string
        }
        Returns: Json
      }
      check_and_award_achievements: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_user_workouts_completed: {
        Args: { p_date_range?: number; p_user_id: string }
        Returns: boolean
      }
      create_workouts_for_user: {
        Args: { p_days?: number; p_user_email: string }
        Returns: Json
      }
      debug_webhook_response: {
        Args: { p_message: string; p_phone_number: string }
        Returns: Json
      }
      delete_user_by_email: {
        Args: { target_email: string }
        Returns: Json
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profile: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          profile_completed: boolean
          profile_data: Json
          questionnaire_completed: boolean
          updated_at: string
        }[]
      }
      get_weekly_schedule: {
        Args: { workout_count: number }
        Returns: number[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_personal_trainer: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      process_user_completion_payment: {
        Args: { p_trainer_id: string; p_user_id: string }
        Returns: Json
      }
      process_whatsapp_response: {
        Args: {
          p_message_text: string
          p_phone_number: string
          p_user_id: string
        }
        Returns: Json
      }
      send_daily_workouts_automated: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_daily_workouts_cron: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_daily_workouts_scheduled: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      to_brazil_time: {
        Args: { timestamp_val: string }
        Returns: string
      }
      update_workout_streak_logic: {
        Args: { p_user_id: string; p_workout_date: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "personal_trainer"
      profile_status_enum:
        | "iniciando_questionario"
        | "questionario_concluido"
        | "gerando_treino"
        | "falha_na_geracao"
        | "treino_gerado"
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
      app_role: ["admin", "user", "personal_trainer"],
      profile_status_enum: [
        "iniciando_questionario",
        "questionario_concluido",
        "gerando_treino",
        "falha_na_geracao",
        "treino_gerado",
      ],
    },
  },
} as const
