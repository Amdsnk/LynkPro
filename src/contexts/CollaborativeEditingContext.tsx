import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/db/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { TextOperation } from '@/lib/operational-transform';

export interface CollaborativeEditor {
  user_id: string;
  email: string;
  full_name: string;
  cursor_position: number;
  selection_start?: number;
  selection_end?: number;
  color: string;
  last_active: string;
}

export interface CollaborativeSession {
  document_id: string;
  document_type: 'report' | 'task' | 'note';
  editors: CollaborativeEditor[];
  operations: TextOperation[];
  version: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
}

interface CollaborativeEditingContextValue {
  activeSession: CollaborativeSession | null;
  joinSession: (documentId: string, documentType: 'report' | 'task' | 'note') => void;
  leaveSession: () => void;
  broadcastOperation: (operation: TextOperation) => void;
  broadcastCursor: (position: number, selectionStart?: number, selectionEnd?: number) => void;
  getEditorColor: (userId: string) => string;
  isAvailable: boolean;
}

const CollaborativeEditingContext = createContext<CollaborativeEditingContextValue | undefined>(undefined);

// Predefined colors for collaborative cursors
const CURSOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function CollaborativeEditingProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [activeSession, setActiveSession] = useState<CollaborativeSession | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  const [isAvailable, setIsAvailable] = useState(true);

  const getEditorColor = useCallback((userId: string): string => {
    if (userColors.has(userId)) {
      return userColors.get(userId)!;
    }
    
    // Assign a new color
    const colorIndex = userColors.size % CURSOR_COLORS.length;
    const color = CURSOR_COLORS[colorIndex];
    setUserColors(prev => new Map(prev).set(userId, color));
    return color;
  }, [userColors]);

  const joinSession = useCallback((documentId: string, documentType: 'report' | 'task' | 'note') => {
    if (!profile?.id) {
      console.warn('Cannot join session: No user profile');
      return;
    }

    // Leave existing session first
    if (channel) {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from previous channel:', error);
      }
    }

    // Set initial connecting state
    setActiveSession({
      document_id: documentId,
      document_type: documentType,
      editors: [],
      operations: [],
      version: 0,
      connectionStatus: 'connecting',
    });

    try {
      // Create new channel for this document
      const newChannel = supabase.channel(`collab:${documentType}:${documentId}`, {
        config: {
          presence: {
            key: profile.id,
          },
          broadcast: {
            self: false, // Don't receive own broadcasts
          },
        },
      });

      // Set a timeout for subscription (5 seconds)
      const subscriptionTimeout = setTimeout(() => {
        console.warn('Collaborative editing subscription timeout - falling back to standard editing');
        setActiveSession(prev => prev ? {
          ...prev,
          connectionStatus: 'error',
          error: 'Connection timeout',
        } : null);
        setIsAvailable(false);
      }, 5000);

      // Subscribe to presence (who's editing)
      newChannel
        .on('presence', { event: 'sync' }, () => {
          try {
            const state = newChannel.presenceState();
            const editors: CollaborativeEditor[] = [];
            
            Object.entries(state).forEach(([userId, presences]) => {
              presences.forEach((presence: any) => {
                editors.push({
                  user_id: userId,
                  email: presence.email,
                  full_name: presence.full_name,
                  cursor_position: presence.cursor_position || 0,
                  selection_start: presence.selection_start,
                  selection_end: presence.selection_end,
                  color: getEditorColor(userId),
                  last_active: presence.last_active,
                });
              });
            });

            setActiveSession(prev => prev ? { ...prev, editors, connectionStatus: 'connected' } : null);
          } catch (error) {
            console.error('Error processing presence sync:', error);
          }
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log('Editor joined:', key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('Editor left:', key);
        })
        // Subscribe to operations (text changes)
        .on('broadcast', { event: 'operation' }, ({ payload }) => {
          try {
            const operation = payload as TextOperation;
            setActiveSession(prev => {
              if (!prev) return null;
              return {
                ...prev,
                operations: [...prev.operations, operation],
                version: prev.version + 1,
              };
            });
          } catch (error) {
            console.error('Error processing operation:', error);
          }
        })
        // Subscribe to cursor updates
        .on('broadcast', { event: 'cursor' }, ({ payload }) => {
          try {
            const { user_id, cursor_position, selection_start, selection_end } = payload;
            setActiveSession(prev => {
              if (!prev) return null;
              const updatedEditors = prev.editors.map(editor =>
                editor.user_id === user_id
                  ? { ...editor, cursor_position, selection_start, selection_end, last_active: new Date().toISOString() }
                  : editor
              );
              return { ...prev, editors: updatedEditors };
            });
          } catch (error) {
            console.error('Error processing cursor update:', error);
          }
        })
        .subscribe(async (status) => {
          clearTimeout(subscriptionTimeout);
          
          if (status === 'SUBSCRIBED') {
            console.log('Collaborative editing connected');
            try {
              // Track presence
              await newChannel.track({
                user_id: profile.id,
                email: profile.email,
                full_name: profile.full_name || profile.email,
                cursor_position: 0,
                last_active: new Date().toISOString(),
              });

              // Update session status
              setActiveSession(prev => prev ? {
                ...prev,
                connectionStatus: 'connected',
              } : null);
              setIsAvailable(true);
            } catch (error) {
              console.error('Error tracking presence:', error);
              setActiveSession(prev => prev ? {
                ...prev,
                connectionStatus: 'error',
                error: 'Failed to track presence',
              } : null);
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Collaborative editing channel error');
            setActiveSession(prev => prev ? {
              ...prev,
              connectionStatus: 'error',
              error: 'Channel error',
            } : null);
            setIsAvailable(false);
          } else if (status === 'TIMED_OUT') {
            console.warn('Collaborative editing timed out');
            setActiveSession(prev => prev ? {
              ...prev,
              connectionStatus: 'error',
              error: 'Connection timed out',
            } : null);
            setIsAvailable(false);
          } else if (status === 'CLOSED') {
            console.log('Collaborative editing channel closed');
            setActiveSession(prev => prev ? {
              ...prev,
              connectionStatus: 'disconnected',
            } : null);
          }
        });

      setChannel(newChannel);
    } catch (error) {
      console.error('Error creating collaborative editing channel:', error);
      setActiveSession(prev => prev ? {
        ...prev,
        connectionStatus: 'error',
        error: 'Failed to create channel',
      } : null);
      setIsAvailable(false);
    }
  }, [profile, channel, getEditorColor]);

  const leaveSession = useCallback(() => {
    if (channel) {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error('Error leaving session:', error);
      }
      setChannel(null);
    }
    setActiveSession(null);
  }, [channel]);

  const broadcastOperation = useCallback((operation: TextOperation) => {
    if (!channel) return;
    
    try {
      channel.send({
        type: 'broadcast',
        event: 'operation',
        payload: operation,
      });
    } catch (error) {
      console.error('Error broadcasting operation:', error);
    }
  }, [channel]);

  const broadcastCursor = useCallback((
    position: number,
    selectionStart?: number,
    selectionEnd?: number
  ) => {
    if (!channel || !profile?.id) return;

    try {
      // Update local presence
      channel.track({
        user_id: profile.id,
        email: profile.email,
        full_name: profile.full_name || profile.email,
        cursor_position: position,
        selection_start: selectionStart,
        selection_end: selectionEnd,
        last_active: new Date().toISOString(),
      });

      // Broadcast cursor update
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          user_id: profile.id,
          cursor_position: position,
          selection_start: selectionStart,
          selection_end: selectionEnd,
        },
      });
    } catch (error) {
      console.error('Error broadcasting cursor:', error);
    }
  }, [channel, profile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.error('Error cleaning up channel:', error);
        }
      }
    };
  }, [channel]);

  return (
    <CollaborativeEditingContext.Provider
      value={{
        activeSession,
        joinSession,
        leaveSession,
        broadcastOperation,
        broadcastCursor,
        getEditorColor,
        isAvailable,
      }}
    >
      {children}
    </CollaborativeEditingContext.Provider>
  );
}

export function useCollaborativeEditing() {
  const context = useContext(CollaborativeEditingContext);
  if (context === undefined) {
    throw new Error('useCollaborativeEditing must be used within a CollaborativeEditingProvider');
  }
  return context;
}
