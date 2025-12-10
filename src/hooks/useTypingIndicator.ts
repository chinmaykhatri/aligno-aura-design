import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  id: string;
  name: string;
}

export const useTypingIndicator = (projectId: string | undefined, currentUserId: string | undefined, currentUserName: string | undefined) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!projectId || !currentUserId) return;

    const channel = supabase.channel(`typing-${projectId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.isTyping && presence.userId !== currentUserId) {
              users.push({
                id: presence.userId,
                name: presence.userName || 'Someone',
              });
            }
          });
        });
        
        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUserId,
            userName: currentUserName || 'User',
            isTyping: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [projectId, currentUserId, currentUserName]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !currentUserId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.track({
      userId: currentUserId,
      userName: currentUserName || 'User',
      isTyping,
    });

    // Auto-stop typing after 3 seconds of inactivity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            userId: currentUserId,
            userName: currentUserName || 'User',
            isTyping: false,
          });
        }
      }, 3000);
    }
  }, [currentUserId, currentUserName]);

  return { typingUsers, setTyping };
};
