import { useState, useMemo } from 'react';
import { useComments } from '@/contexts/CommentContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommentThread } from './CommentThread';
import { MessageSquare, Filter, Check, X } from 'lucide-react';
import type { ReportComment } from '@/types/types';

interface CommentSidebarProps {
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'unresolved' | 'resolved' | 'mentions';

export function CommentSidebar({ reportId, isOpen, onClose }: CommentSidebarProps) {
  const { comments, getUnreadMentionsCount } = useComments();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Get root comments (not replies)
  const rootComments = useMemo(() => {
    return comments.filter(c => !c.parent_comment_id);
  }, [comments]);

  // Filter comments
  const filteredComments = useMemo(() => {
    let filtered = rootComments;

    switch (filter) {
      case 'unresolved':
        filtered = filtered.filter(c => !c.is_resolved);
        break;
      case 'resolved':
        filtered = filtered.filter(c => c.is_resolved);
        break;
      case 'mentions':
        // Show comments where user is mentioned
        filtered = filtered.filter(c => 
          c.mentions?.some(m => !m.is_read)
        );
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [rootComments, filter]);

  const unreadMentions = getUnreadMentionsCount();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Comments</h2>
            <Badge variant="secondary">{filteredComments.length}</Badge>
            {unreadMentions > 0 && (
              <Badge variant="default" className="ml-auto">
                {unreadMentions} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="mentions">
                Mentions {unreadMentions > 0 && `(${unreadMentions})`}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comment List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                {filter === 'all' && 'No comments yet'}
                {filter === 'unresolved' && 'No unresolved comments'}
                {filter === 'resolved' && 'No resolved comments'}
                {filter === 'mentions' && 'No unread mentions'}
              </p>
            </div>
          ) : (
            filteredComments.map(comment => (
              <div
                key={comment.id}
                className={`cursor-pointer transition-colors ${
                  selectedCommentId === comment.id ? 'ring-2 ring-primary rounded-lg' : ''
                }`}
                onClick={() => setSelectedCommentId(
                  selectedCommentId === comment.id ? null : comment.id
                )}
              >
                {selectedCommentId === comment.id ? (
                  <CommentThread
                    comment={comment}
                    reportId={reportId}
                    onClose={() => setSelectedCommentId(null)}
                  />
                ) : (
                  <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {comment.author?.full_name || comment.author?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {comment.field_name === 'field_notes' ? 'Field Notes' : 'Narrative'}
                        </p>
                      </div>
                      {comment.is_resolved ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Check className="h-3 w-3" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Open
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mb-2 p-2 bg-accent/20 rounded text-xs border-l-2 border-primary">
                      <p className="italic line-clamp-2">&quot;{comment.selected_text}&quot;</p>
                    </div>
                    
                    <p className="text-sm line-clamp-2">{comment.comment_text}</p>
                    
                    {comment.mentions && comment.mentions.length > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        {comment.mentions.some(m => !m.is_read) && (
                          <Badge variant="default" className="text-xs">
                            New mention
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
