import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborativeEditing } from '@/contexts/CollaborativeEditingContext';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  applyOperation,
  transformOperation,
  generateOperation,
  isValidOperation,
  type TextOperation,
} from '@/lib/operational-transform';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface CollaborativeEditorProps {
  documentId: string;
  documentType: 'report' | 'task' | 'note';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export function CollaborativeEditor({
  documentId,
  documentType,
  value,
  onChange,
  placeholder,
  className,
  disabled,
  rows = 10,
}: CollaborativeEditorProps) {
  const { profile } = useAuth();
  const {
    activeSession,
    joinSession,
    leaveSession,
    broadcastOperation,
    broadcastCursor,
    getEditorColor,
    isAvailable,
  } = useCollaborativeEditing();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const [pendingOperations, setPendingOperations] = useState<TextOperation[]>([]);
  const lastValueRef = useRef(value);
  const isApplyingRemoteChange = useRef(false);
  const [useFallback, setUseFallback] = useState(false);

  // Join session on mount
  useEffect(() => {
    // Only join if we have a valid document ID and user is authenticated
    if (!documentId || !profile?.id) return;
    
    joinSession(documentId, documentType);
    return () => {
      leaveSession();
    };
  }, [documentId, documentType, profile?.id, joinSession, leaveSession]);

  // Check for connection errors and fall back to standard textarea
  useEffect(() => {
    if (activeSession?.connectionStatus === 'error' || !isAvailable) {
      console.warn('Collaborative editing unavailable, using standard textarea');
      setUseFallback(true);
    }
  }, [activeSession?.connectionStatus, isAvailable]);

  // If fallback mode or not available, render standard textarea
  if (useFallback || !isAvailable || activeSession?.connectionStatus === 'error') {
    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={className}
        />
        {activeSession?.connectionStatus === 'error' && (
          <p className="text-xs text-muted-foreground mt-1">
            Collaborative editing unavailable - using standard mode
          </p>
        )}
      </div>
    );
  }

  // Handle remote operations
  useEffect(() => {
    if (!activeSession || activeSession.operations.length === 0) return;

    const latestOperation = activeSession.operations[activeSession.operations.length - 1];
    
    // Ignore own operations
    if (latestOperation.userId === profile?.id) return;

    // Apply remote operation
    isApplyingRemoteChange.current = true;
    
    try {
      // Transform pending operations against the remote operation
      const transformedPending = pendingOperations.map(op =>
        transformOperation(op, latestOperation, false)
      );
      setPendingOperations(transformedPending);

      // Apply the remote operation to local value
      if (isValidOperation(latestOperation, localValue.length)) {
        const newValue = applyOperation(localValue, latestOperation);
        setLocalValue(newValue);
        onChange(newValue);
        lastValueRef.current = newValue;
      }
    } finally {
      isApplyingRemoteChange.current = false;
    }
  }, [activeSession?.operations]);

  // Handle local text changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isApplyingRemoteChange.current || !profile?.id) return;

    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Generate operation from change
    const operation = generateOperation(
      lastValueRef.current,
      newValue,
      cursorPosition,
      profile.id
    );

    if (operation) {
      // Add to pending operations
      setPendingOperations(prev => [...prev, operation]);

      // Broadcast operation
      broadcastOperation(operation);
    }

    setLocalValue(newValue);
    onChange(newValue);
    lastValueRef.current = newValue;
  }, [profile?.id, broadcastOperation, onChange]);

  // Handle cursor movement
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;

    const { selectionStart, selectionEnd } = textareaRef.current;
    
    // Broadcast cursor position
    if (selectionStart === selectionEnd) {
      broadcastCursor(selectionStart);
    } else {
      broadcastCursor(selectionStart, selectionStart, selectionEnd);
    }
  }, [broadcastCursor]);

  // Debounced cursor broadcast
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let timeoutId: NodeJS.Timeout;

    const handleSelectionChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelect, 100);
    };

    textarea.addEventListener('select', handleSelectionChange);
    textarea.addEventListener('click', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);

    return () => {
      clearTimeout(timeoutId);
      textarea.removeEventListener('select', handleSelectionChange);
      textarea.removeEventListener('click', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
    };
  }, [handleSelect]);

  const otherEditors = activeSession?.editors.filter(e => e.user_id !== profile?.id) || [];
  const isConnected = activeSession?.connectionStatus === 'connected';
  const isConnecting = activeSession?.connectionStatus === 'connecting';

  return (
    <div className="relative">
      {/* Editor Status Bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Wifi className="h-3 w-3 text-muted-foreground animate-pulse" />
              Connecting...
            </Badge>
          ) : isConnected ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Wifi className="h-3 w-3 text-healthy" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              Offline
            </Badge>
          )}
          
          {otherEditors.length > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {otherEditors.length} {otherEditors.length === 1 ? 'editor' : 'editors'}
            </Badge>
          )}
        </div>

        {/* Active Editors */}
        {otherEditors.length > 0 && (
          <div className="flex items-center gap-1">
            {otherEditors.slice(0, 3).map((editor) => (
              <div
                key={editor.user_id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                style={{
                  backgroundColor: `${editor.color}15`,
                  borderLeft: `2px solid ${editor.color}`,
                }}
              >
                <span className="font-medium truncate max-w-[100px]">
                  {editor.full_name}
                </span>
              </div>
            ))}
            {otherEditors.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{otherEditors.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Collaborative Textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(
            'font-mono text-sm resize-none',
            isConnected && 'ring-2 ring-primary/20',
            className
          )}
        />

        {/* Remote Cursors Overlay */}
        {otherEditors.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {otherEditors.map((editor) => (
              <RemoteCursor
                key={editor.user_id}
                editor={editor}
                textareaRef={textareaRef}
                content={localValue}
              />
            ))}
          </div>
        )}
      </div>

      {/* Typing Indicators */}
      {otherEditors.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {otherEditors.map((editor) => {
            const isRecent = new Date().getTime() - new Date(editor.last_active).getTime() < 3000;
            if (!isRecent) return null;
            
            return (
              <div key={editor.user_id} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{ backgroundColor: editor.color }}
                />
                <span>{editor.full_name} is typing...</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Remote Cursor Component
interface RemoteCursorProps {
  editor: any;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
}

function RemoteCursor({ editor, textareaRef, content }: RemoteCursorProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = editor.cursor_position;

    // Calculate cursor position
    // This is a simplified version - in production, you'd want more accurate positioning
    const lines = content.substring(0, cursorPos).split('\n');
    const lineNumber = lines.length - 1;
    const columnNumber = lines[lines.length - 1].length;

    // Approximate position (this is simplified)
    const lineHeight = 24; // Approximate line height
    const charWidth = 8; // Approximate character width
    
    setPosition({
      top: lineNumber * lineHeight + 8,
      left: columnNumber * charWidth + 12,
    });
  }, [editor.cursor_position, content, textareaRef]);

  return (
    <div
      className="absolute pointer-events-none transition-all duration-100"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: editor.color }}
      />
      {/* User label */}
      <div
        className="absolute top-0 left-1 px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: editor.color }}
      >
        {editor.full_name}
      </div>
    </div>
  );
}
