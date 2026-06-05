import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Comment, CommentEntityType } from '@/types/types';

interface CommentThreadProps {
  entityType: CommentEntityType;
  entityId: string;
}

export function CommentThread({ entityType, entityId }: CommentThreadProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [entityType, entityId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!created_by(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !profile?.firm_id) return;

    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [...newComment.matchAll(mentionRegex)].map(m => m[1]);

    const { error } = await supabase.from('comments').insert({
      firm_id: profile.firm_id,
      entity_type: entityType,
      entity_id: entityId,
      content: newComment,
      mentions: mentions,
      created_by: profile.id,
    });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setNewComment('');
      fetchComments();
    }
  };

  if (loading) return <div>Loading comments...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.author?.full_name?.[0] || comment.author?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author?.full_name || comment.author?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="Write a comment... Use @name to mention someone"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} size="sm" disabled={!newComment.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Post Comment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
