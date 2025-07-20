import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  preferred_language: 'en' | 'de';
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateLanguage: (language: 'en' | 'de') => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      loading: false,
      error: null,

      loadProfile: async () => {
        try {
          set({ loading: true, error: null });
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ profile: null, loading: false });
            return;
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            // If profile doesn't exist, create one
            if (error.code === 'PGRST116') {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  user_id: user.id,
                  display_name: user.email,
                  preferred_language: 'en' as const
                })
                .select()
                .single();

              if (createError) throw createError;
              set({ profile: newProfile as UserProfile, loading: false });
            } else {
              throw error;
            }
          } else {
            set({ profile: profile as UserProfile, loading: false });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load profile',
            loading: false 
          });
        }
      },

      updateLanguage: async (language: 'en' | 'de') => {
        try {
          set({ loading: true, error: null });
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({ preferred_language: language })
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ profile: updatedProfile as UserProfile, loading: false });
        } catch (error) {
          console.error('Error updating language:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update language',
            loading: false 
          });
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        try {
          set({ loading: true, error: null });
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ profile: updatedProfile as UserProfile, loading: false });
        } catch (error) {
          console.error('Error updating profile:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update profile',
            loading: false 
          });
        }
      },

      clearProfile: () => {
        set({ profile: null, loading: false, error: null });
      }
    }),
    {
      name: 'user-profile',
      partialize: (state) => ({ profile: state.profile }) // Only persist profile data
    }
  )
);