import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/db/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  user_id: string;
  email: string;
  full_name: string;
  page?: string;
  last_seen: string;
}

interface PresenceState {
  [key: string]: PresenceUser[];
}

interface PresenceContextValue {
  onlineUsers: PresenceUser[];
  usersOnPage: (page: string) => PresenceUser[];
  trackPresence: (page: string) => void;
  untrackPresence: () => void;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [currentPage, setCurrentPage] = useState<string>('');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!profile?.id || !profile?.firm_id) return;

    // Create presence channel for the firm
    const presenceChannel = supabase.channel(`presence:firm:${profile.firm_id}`, {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    // Subscribe to presence changes
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        // Transform the presence state to our format
        const transformedState: PresenceState = {};
        Object.entries(state).forEach(([key, presences]) => {
          transformedState[key] = presences.map((p: any) => ({
            user_id: p.user_id,
            email: p.email,
            full_name: p.full_name,
            page: p.page,
            last_seen: p.last_seen,
          }));
        });
        setPresenceState(transformedState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence
          await presenceChannel.track({
            user_id: profile.id,
            email: profile.email,
            full_name: profile.full_name || profile.email,
            page: currentPage || 'dashboard',
            last_seen: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [profile?.id, profile?.firm_id]);

  // Update presence when page changes
  useEffect(() => {
    if (channel && currentPage && profile) {
      channel.track({
        user_id: profile.id,
        email: profile.email,
        full_name: profile.full_name || profile.email,
        page: currentPage,
        last_seen: new Date().toISOString(),
      });
    }
  }, [currentPage, channel, profile]);

  const trackPresence = (page: string) => {
    setCurrentPage(page);
  };

  const untrackPresence = () => {
    setCurrentPage('');
  };

  const onlineUsers: PresenceUser[] = Object.values(presenceState)
    .flat()
    .filter((user) => user.user_id !== profile?.id); // Exclude current user

  const usersOnPage = (page: string): PresenceUser[] => {
    return onlineUsers.filter((user) => user.page === page);
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.some((user) => user.user_id === userId);
  };

  return (
    <PresenceContext.Provider
      value={{
        onlineUsers,
        usersOnPage,
        trackPresence,
        untrackPresence,
        isUserOnline,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
