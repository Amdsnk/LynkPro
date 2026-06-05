import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { toast } from 'sonner';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
  return data;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string, bypass2FA?: boolean) => Promise<{ error: Error | null; requires2FA?: boolean; userId?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  complete2FALogin: (userId: string) => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    supabase
      .auth
      .getSession()
      // @ts-ignore
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id).then(setProfile);
        }
      })
      .catch((error: Error) => {
        toast.error(`Failed to fetch user info: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });

    // @ts-ignore
    // In this function, do NOT use any await calls. Use `.then()` instead to avoid deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, bypass2FA = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has 2FA enabled (unless bypassing)
      if (data.user && !bypass2FA) {
        const { data: totpData } = await supabase
          .from('totp_secrets')
          .select('is_enabled')
          .eq('user_id', data.user.id)
          .eq('is_enabled', true)
          .maybeSingle();

        if (totpData?.is_enabled) {
          // Sign out immediately - user needs to verify 2FA first
          await supabase.auth.signOut();
          return { 
            error: null, 
            requires2FA: true, 
            userId: data.user.id 
          };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const complete2FALogin = async (userId: string) => {
    // After 2FA verification, sign in the user by fetching their session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // If no session exists, we need to create one
      // This is a workaround - in production, you'd want to use a custom token
      // For now, we'll refresh the session
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Failed to refresh session after 2FA:', error);
        throw error;
      }
    }
    
    // Refresh user and profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const profileData = await getProfile(user.id);
      setProfile(profileData);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';
  const isClient = profile?.role === 'client';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      refreshProfile,
      complete2FALogin,
      isAdmin,
      isStaff,
      isClient
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
