import { useState, useRef, useEffect } from 'react';
import { useComments } from '@/contexts/CommentContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';
import { Send, X, AtSign } from 'lucide-react';

interface CommentInputProps {
  reportId: string;
  parentCommentId?: string;
  onCancel?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function CommentInput({
  reportId,
  parentCommentId,
  onCancel,
  onSubmit,
  placeholder = 'Add a comment...',
}: CommentInputProps) {
  const { createComment, replyToComment } = useComments();
  const [commentText, setCommentText] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<Profile[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<Profile[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load team members for mentions
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setMentionSuggestions(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  // Handle text change and detect @mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    
    setCommentText(text);
    setCursorPosition(cursor);

    // Check if user is typing @mention
    const textBeforeCursor = text.slice(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      // Check if there's a space after @, if so, stop showing suggestions
      if (textAfterAt.includes(' ')) {
        setShowMentionSuggestions(false);
        return;
      }
      
      setMentionSearch(textAfterAt.toLowerCase());
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Insert mention
  const insertMention = (user: Profile) => {
    const textBeforeCursor = commentText.slice(0, cursorPosition);
    const textAfterCursor = commentText.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      commentText.slice(0, lastAtIndex) + 
      `@${user.full_name || user.email} ` + 
      textAfterCursor;
    
    setCommentText(newText);
    setShowMentionSuggestions(false);
    
    // Add to mentioned users if not already added
    if (!mentionedUsers.find(u => u.id === user.id)) {
      setMentionedUsers([...mentionedUsers, user]);
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  // Filter mention suggestions
  const filteredSuggestions = mentionSuggestions.filter(user => {
    const name = (user.full_name || user.email).toLowerCase();
    return name.includes(mentionSearch);
  }).slice(0, 5);

  // Handle submit
  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    const mentionedUserIds = mentionedUsers.map(u => u.id);

    if (parentCommentId) {
      await replyToComment(parentCommentId, commentText, mentionedUserIds);
    } else {
      await createComment(reportId, commentText, mentionedUserIds);
    }

    setCommentText('');
    setMentionedUsers([]);
    onSubmit?.();
  };

  // Handle cancel
  const handleCancel = () => {
    setCommentText('');
    setMentionedUsers([]);
    onCancel?.();
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={commentText}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={3}
          className="resize-none"
        />
        
        {/* Mention Suggestions */}
        {showMentionSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
            {filteredSuggestions.map(user => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
              >
                <AtSign className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{user.full_name || user.email}</span>
                {user.full_name && (
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mentioned Users */}
      {mentionedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {mentionedUsers.map(user => (
            <div
              key={user.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
            >
              <AtSign className="h-3 w-3" />
              <span>{user.full_name || user.email}</span>
              <button
                onClick={() => setMentionedUsers(mentionedUsers.filter(u => u.id !== user.id))}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Type @ to mention teammates
        </p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8"
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!commentText.trim()}
            className="h-8"
          >
            <Send className="h-3 w-3 mr-1" />
            {parentCommentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
