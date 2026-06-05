import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/db/supabase';
import type { ReportComment, CommentMention, CommentFieldName, Profile } from '@/types/types';
import { toast } from 'sonner';

interface TextSelection {
  fieldName: CommentFieldName;
  start: number;
  end: number;
  text: string;
}

interface CommentContextValue {
  comments: ReportComment[];
  activeSelection: TextSelection | null;
  isCommentMode: boolean;
  setIsCommentMode: (mode: boolean) => void;
  setActiveSelection: (selection: TextSelection | null) => void;
  createComment: (reportId: string, commentText: string, mentionedUserIds: string[]) => Promise<void>;
  replyToComment: (parentCommentId: string, commentText: string, mentionedUserIds: string[]) => Promise<void>;
  resolveThread: (commentId: string) => Promise<void>;
  unresolveThread: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  loadComments: (reportId: string) => Promise<void>;
  markMentionAsRead: (mentionId: string) => Promise<void>;
  getThreadComments: (parentCommentId: string) => ReportComment[];
  getUnreadMentionsCount: () => number;
}

const CommentContext = createContext<CommentContextValue | undefined>(undefined);

export function CommentProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [activeSelection, setActiveSelection] = useState<TextSelection | null>(null);
  const [isCommentMode, setIsCommentMode] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Load comments for a report
  const loadComments = useCallback(async (reportId: string) => {
    try {
      setCurrentReportId(reportId);

      const { data, error } = await supabase
        .from('report_comments')
        .select(`
          *,
          author:profiles!report_comments_user_id_fkey(id, email, full_name),
          resolver:profiles!report_comments_resolved_by_fkey(id, email, full_name),
          mentions:comment_mentions(
            id,
            mentioned_user_id,
            is_read,
            read_at,
            created_at,
            mentioned_user:profiles!comment_mentions_mentioned_user_id_fkey(id, email, full_name)
          )
        `)
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    }
  }, []);

  // Subscribe to real-time comment updates
  useEffect(() => {
    if (!currentReportId) return;

    const channel = supabase
      .channel(`report_comments:${currentReportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_comments',
          filter: `report_id=eq.${currentReportId}`,
        },
        () => {
          // Reload comments when changes occur
          loadComments(currentReportId);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentReportId, loadComments]);

  // Create a new comment
  const createComment = useCallback(async (
    reportId: string,
    commentText: string,
    mentionedUserIds: string[]
  ) => {
    if (!profile?.id || !activeSelection) {
      toast.error('Cannot create comment');
      return;
    }

    try {
      // Insert comment
      const { data: comment, error: commentError } = await supabase
        .from('report_comments')
        .insert({
          report_id: reportId,
          user_id: profile.id,
          field_name: activeSelection.fieldName,
          selection_start: activeSelection.start,
          selection_end: activeSelection.end,
          selected_text: activeSelection.text,
          comment_text: commentText,
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Insert mentions
      if (mentionedUserIds.length > 0 && comment) {
        const mentions = mentionedUserIds.map(userId => ({
          comment_id: comment.id,
          mentioned_user_id: userId,
        }));

        const { error: mentionError } = await supabase
          .from('comment_mentions')
          .insert(mentions);

        if (mentionError) throw mentionError;
      }

      toast.success('Comment added');
      setActiveSelection(null);
      setIsCommentMode(false);
      
      // Reload comments
      await loadComments(reportId);
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
    }
  }, [profile, activeSelection, loadComments]);

  // Reply to a comment
  const replyToComment = useCallback(async (
    parentCommentId: string,
    commentText: string,
    mentionedUserIds: string[]
  ) => {
    if (!profile?.id || !currentReportId) {
      toast.error('Cannot reply to comment');
      return;
    }

    try {
      // Get parent comment to inherit selection info
      const parentComment = comments.find(c => c.id === parentCommentId);
      if (!parentComment) throw new Error('Parent comment not found');

      // Insert reply
      const { data: reply, error: replyError } = await supabase
        .from('report_comments')
        .insert({
          report_id: currentReportId,
          user_id: profile.id,
          parent_comment_id: parentCommentId,
          field_name: parentComment.field_name,
          selection_start: parentComment.selection_start,
          selection_end: parentComment.selection_end,
          selected_text: parentComment.selected_text,
          comment_text: commentText,
        })
        .select()
        .single();

      if (replyError) throw replyError;

      // Insert mentions
      if (mentionedUserIds.length > 0 && reply) {
        const mentions = mentionedUserIds.map(userId => ({
          comment_id: reply.id,
          mentioned_user_id: userId,
        }));

        const { error: mentionError } = await supabase
          .from('comment_mentions')
          .insert(mentions);

        if (mentionError) throw mentionError;
      }

      toast.success('Reply added');
      
      // Reload comments
      await loadComments(currentReportId);
    } catch (error) {
      console.error('Error replying to comment:', error);
      toast.error('Failed to add reply');
    }
  }, [profile, currentReportId, comments, loadComments]);

  // Resolve a comment thread
  const resolveThread = useCallback(async (commentId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('report_comments')
        .update({
          is_resolved: true,
          resolved_by: profile.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Thread resolved');
      
      // Reload comments
      if (currentReportId) {
        await loadComments(currentReportId);
      }
    } catch (error) {
      console.error('Error resolving thread:', error);
      toast.error('Failed to resolve thread');
    }
  }, [profile, currentReportId, loadComments]);

  // Unresolve a comment thread
  const unresolveThread = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('report_comments')
        .update({
          is_resolved: false,
          resolved_by: null,
          resolved_at: null,
        })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Thread reopened');
      
      // Reload comments
      if (currentReportId) {
        await loadComments(currentReportId);
      }
    } catch (error) {
      console.error('Error unresolving thread:', error);
      toast.error('Failed to reopen thread');
    }
  }, [currentReportId, loadComments]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('report_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');
      
      // Reload comments
      if (currentReportId) {
        await loadComments(currentReportId);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  }, [currentReportId, loadComments]);

  // Mark mention as read
  const markMentionAsRead = useCallback(async (mentionId: string) => {
    try {
      const { error } = await supabase
        .from('comment_mentions')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', mentionId);

      if (error) throw error;

      // Reload comments to update mention status
      if (currentReportId) {
        await loadComments(currentReportId);
      }
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  }, [currentReportId, loadComments]);

  // Get all replies for a comment
  const getThreadComments = useCallback((parentCommentId: string): ReportComment[] => {
    return comments.filter(c => c.parent_comment_id === parentCommentId);
  }, [comments]);

  // Get unread mentions count
  const getUnreadMentionsCount = useCallback((): number => {
    if (!profile?.id) return 0;
    
    let count = 0;
    comments.forEach(comment => {
      comment.mentions?.forEach(mention => {
        if (mention.mentioned_user_id === profile.id && !mention.is_read) {
          count++;
        }
      });
    });
    return count;
  }, [comments, profile]);

  return (
    <CommentContext.Provider
      value={{
        comments,
        activeSelection,
        isCommentMode,
        setIsCommentMode,
        setActiveSelection,
        createComment,
        replyToComment,
        resolveThread,
        unresolveThread,
        deleteComment,
        loadComments,
        markMentionAsRead,
        getThreadComments,
        getUnreadMentionsCount,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error('useComments must be used within CommentProvider');
  }
  return context;
}
