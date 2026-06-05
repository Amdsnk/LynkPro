import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/contexts/CommentContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Check, X, Trash2, CornerDownRight } from 'lucide-react';
import { CommentInput } from './CommentInput';
import type { ReportComment } from '@/types/types';

interface CommentThreadProps {
  comment: ReportComment;
  reportId: string;
  onClose?: () => void;
}

export function CommentThread({ comment, reportId, onClose }: CommentThreadProps) {
  const { profile } = useAuth();
  const {
    getThreadComments,
    resolveThread,
    unresolveThread,
    deleteComment,
    markMentionAsRead,
  } = useComments();
  
  const [showReplyInput, setShowReplyInput] = useState(false);
  const replies = getThreadComments(comment.id);
  const isAuthor = profile?.id === comment.user_id;
  const isResolved = comment.is_resolved;

  // Mark mentions as read when viewing
  useState(() => {
    comment.mentions?.forEach(mention => {
      if (mention.mentioned_user_id === profile?.id && !mention.is_read) {
        markMentionAsRead(mention.id);
      }
    });
  });

  const handleResolve = async () => {
    if (isResolved) {
      await unresolveThread(comment.id);
    } else {
      await resolveThread(comment.id);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(comment.id);
      onClose?.();
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {/* Root Comment */}
      <div className={`p-3 rounded-lg border ${isResolved ? 'bg-muted/30' : 'bg-background'}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {getInitials(comment.author?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {comment.author?.full_name || comment.author?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isResolved && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Check className="h-3 w-3" />
                Resolved
              </Badge>
            )}
          </div>
        </div>

        {/* Selected Text */}
        <div className="mb-2 p-2 bg-accent/20 rounded text-sm border-l-2 border-primary">
          <p className="text-xs text-muted-foreground mb-1">
            {comment.field_name === 'field_notes' ? 'Field Notes' : 'Narrative'}
          </p>
          <p className="italic">&quot;{comment.selected_text}&quot;</p>
        </div>

        {/* Comment Text */}
        <p className="text-sm whitespace-pre-wrap mb-3">{comment.comment_text}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="h-7 text-xs"
          >
            <CornerDownRight className="h-3 w-3 mr-1" />
            Reply
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResolve}
            className="h-7 text-xs"
          >
            {isResolved ? (
              <>
                <X className="h-3 w-3 mr-1" />
                Reopen
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </>
            )}
          </Button>

          {isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}

          {replies.length > 0 && (
            <Badge variant="outline" className="ml-auto text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Badge>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-6 pl-3 border-l-2 border-muted">
          <CommentInput
            reportId={reportId}
            parentCommentId={comment.id}
            onCancel={() => setShowReplyInput(false)}
            onSubmit={() => setShowReplyInput(false)}
            placeholder="Write a reply..."
          />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-6 space-y-2 pl-3 border-l-2 border-muted">
          {replies.map(reply => (
            <div key={reply.id} className="p-2 rounded-lg bg-muted/30">
              <div className="flex items-start gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(reply.author?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">
                      {reply.author?.full_name || reply.author?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{reply.comment_text}</p>
                  
                  {reply.user_id === profile?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteComment(reply.id)}
                      className="h-6 text-xs mt-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
