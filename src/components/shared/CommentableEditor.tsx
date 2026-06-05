import { useState, useRef, useEffect } from 'react';
import { useComments } from '@/contexts/CommentContext';
import { CollaborativeEditor } from './CollaborativeEditor';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommentInput } from '@/components/comments/CommentInput';
import { CommentSidebar } from '@/components/comments/CommentSidebar';
import { MessageSquare, MessageSquarePlus, X } from 'lucide-react';
import type { CommentFieldName } from '@/types/types';

interface CommentableEditorProps {
  documentId: string;
  documentType: 'report' | 'task' | 'note';
  fieldName: CommentFieldName;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
  isCollaborative?: boolean;
}

export function CommentableEditor({
  documentId,
  documentType,
  fieldName,
  value,
  onChange,
  placeholder,
  className,
  disabled,
  rows = 10,
  isCollaborative = true,
}: CommentableEditorProps) {
  const {
    comments,
    isCommentMode,
    setIsCommentMode,
    setActiveSelection,
    activeSelection,
    getUnreadMentionsCount,
  } = useComments();
  
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get comments for this field
  const fieldComments = comments.filter(c => 
    c.field_name === fieldName && !c.parent_comment_id
  );
  const unresolvedCount = fieldComments.filter(c => !c.is_resolved).length;
  const unreadMentions = getUnreadMentionsCount();

  // Handle text selection
  const handleSelect = () => {
    if (!isCommentMode || !textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start !== end) {
      const selectedText = value.substring(start, end);
      setSelection({ start, end });
      setActiveSelection({
        fieldName,
        start,
        end,
        text: selectedText,
      });
      setShowCommentInput(true);
    }
  };

  // Cancel comment
  const handleCancelComment = () => {
    setShowCommentInput(false);
    setSelection(null);
    setActiveSelection(null);
    setIsCommentMode(false);
  };

  // Submit comment
  const handleSubmitComment = () => {
    setShowCommentInput(false);
    setSelection(null);
    setActiveSelection(null);
    setIsCommentMode(false);
  };

  // Render comment indicators
  const renderCommentIndicators = () => {
    if (fieldComments.length === 0) return null;

    return (
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        {fieldComments.map(comment => {
          if (comment.is_resolved) return null;
          
          return (
            <div
              key={comment.id}
              className="w-2 h-2 rounded-full bg-primary cursor-pointer hover:scale-125 transition-transform"
              title={`Comment by ${comment.author?.full_name}: ${comment.comment_text.slice(0, 50)}...`}
              onClick={() => setShowCommentSidebar(true)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isCommentMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsCommentMode(!isCommentMode);
              if (isCommentMode) {
                handleCancelComment();
              }
            }}
            className="h-8"
          >
            {isCommentMode ? (
              <>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-3 w-3 mr-1" />
                Add Comment
              </>
            )}
          </Button>

          {isCommentMode && (
            <p className="text-xs text-muted-foreground">
              Select text to comment on
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unresolvedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unresolvedCount} unresolved
            </Badge>
          )}
          {unreadMentions > 0 && (
            <Badge variant="default" className="text-xs">
              {unreadMentions} new mentions
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCommentSidebar(!showCommentSidebar)}
            className="h-8"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Comments ({fieldComments.length})
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        {isCollaborative ? (
          <div onMouseUp={handleSelect}>
            <CollaborativeEditor
              documentId={documentId}
              documentType={documentType}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className={className}
              disabled={disabled || isCommentMode}
              rows={rows}
            />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onMouseUp={handleSelect}
            placeholder={placeholder}
            className={className}
            disabled={disabled || isCommentMode}
            rows={rows}
          />
        )}
        
        {renderCommentIndicators()}
      </div>

      {/* Comment Input */}
      {showCommentInput && activeSelection && (
        <div className="p-3 border rounded-lg bg-accent/20">
          <div className="mb-2 p-2 bg-background rounded text-sm border-l-2 border-primary">
            <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
            <p className="italic">&quot;{activeSelection.text}&quot;</p>
          </div>
          <CommentInput
            reportId={documentId}
            onCancel={handleCancelComment}
            onSubmit={handleSubmitComment}
            placeholder="Add your comment..."
          />
        </div>
      )}

      {/* Comment Sidebar */}
      <CommentSidebar
        reportId={documentId}
        isOpen={showCommentSidebar}
        onClose={() => setShowCommentSidebar(false)}
      />
    </div>
  );
}
