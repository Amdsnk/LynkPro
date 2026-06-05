import { useState, useEffect } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Sparkles, Clock, TrendingUp, AlertCircle, FileText, Users, DollarSign, Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CommandSuggestion {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'suggestion' | 'recent' | 'quick';
  keywords?: string[];
}

// Simple NLP-like intent detection
function detectIntent(query: string): { intent: string; entities: string[] } | null {
  const lowerQuery = query.toLowerCase();
  
  // Risk-related queries
  if (lowerQuery.match(/risk|danger|problem|issue|concern/)) {
    return { intent: 'show_risks', entities: ['projects'] };
  }
  
  // Overdue/late queries
  if (lowerQuery.match(/overdue|late|past due|unpaid/)) {
    return { intent: 'show_overdue', entities: ['invoices'] };
  }
  
  // Revenue/financial queries
  if (lowerQuery.match(/revenue|money|income|financial|forecast/)) {
    return { intent: 'show_financial', entities: ['revenue'] };
  }
  
  // Project queries
  if (lowerQuery.match(/project|work|task/)) {
    if (lowerQuery.match(/active|current|ongoing/)) {
      return { intent: 'show_active_projects', entities: ['projects'] };
    }
    return { intent: 'show_projects', entities: ['projects'] };
  }
  
  // Team queries
  if (lowerQuery.match(/team|people|staff|capacity/)) {
    return { intent: 'show_team', entities: ['team'] };
  }
  
  // Field operations
  if (lowerQuery.match(/field|site|location|today/)) {
    return { intent: 'show_field', entities: ['field'] };
  }
  
  return null;
}

export function AICommandBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const navigate = useNavigate();

  // Check voice support
  useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Voice input handler
  const startVoiceInput = () => {
    if (!voiceSupported) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      
      // Auto-execute if intent is clear
      const intent = detectIntent(transcript);
      if (intent) {
        executeIntent(intent.intent);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceInput = () => {
    setIsListening(false);
  };

  // Execute detected intent
  const executeIntent = (intent: string) => {
    switch (intent) {
      case 'show_risks':
        navigate('/projects?filter=at-risk');
        setOpen(false);
        break;
      case 'show_overdue':
        navigate('/invoices?filter=overdue');
        setOpen(false);
        break;
      case 'show_financial':
        navigate('/financial-intelligence');
        setOpen(false);
        break;
      case 'show_projects':
      case 'show_active_projects':
        navigate('/projects');
        setOpen(false);
        break;
      case 'show_team':
        navigate('/projects');
        setOpen(false);
        break;
      case 'show_field':
        navigate('/field-operations');
        setOpen(false);
        break;
    }
  };

  // Context-aware suggestions with keywords
  const suggestions: CommandSuggestion[] = [
    {
      id: 'projects-at-risk',
      label: 'Show projects at risk',
      icon: <AlertCircle className="h-4 w-4 text-critical" />,
      action: () => {
        navigate('/projects?filter=at-risk');
        setOpen(false);
      },
      category: 'suggestion',
      keywords: ['risk', 'danger', 'problem', 'issue'],
    },
    {
      id: 'overdue-invoices',
      label: 'Show overdue invoices',
      icon: <DollarSign className="h-4 w-4 text-critical" />,
      action: () => {
        navigate('/invoices?filter=overdue');
        setOpen(false);
      },
      category: 'suggestion',
      keywords: ['overdue', 'late', 'unpaid', 'payment'],
    },
    {
      id: 'revenue-forecast',
      label: 'View revenue forecast',
      icon: <TrendingUp className="h-4 w-4 text-insight" />,
      action: () => {
        navigate('/financial-intelligence');
        setOpen(false);
      },
      category: 'suggestion',
      keywords: ['revenue', 'money', 'financial', 'forecast'],
    },
    {
      id: 'field-activity',
      label: 'Show today\'s field activity',
      icon: <FileText className="h-4 w-4 text-foreground" />,
      action: () => {
        navigate('/field-operations');
        setOpen(false);
      },
      category: 'suggestion',
      keywords: ['field', 'site', 'today', 'activity'],
    },
    {
      id: 'team-capacity',
      label: 'Check team capacity',
      icon: <Users className="h-4 w-4 text-foreground" />,
      action: () => {
        navigate('/projects');
        setOpen(false);
      },
      category: 'suggestion',
      keywords: ['team', 'people', 'capacity', 'staff'],
    },
  ];

  // Enhanced filtering with keyword matching
  const filteredSuggestions = suggestions.filter((s) => {
    const searchLower = search.toLowerCase();
    const labelMatch = s.label.toLowerCase().includes(searchLower);
    const keywordMatch = s.keywords?.some(k => searchLower.includes(k)) || false;
    return labelMatch || keywordMatch;
  });

  // Detect intent from search query
  const detectedIntent = search.length > 3 ? detectIntent(search) : null;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Ask anything or type a command...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Sparkles className="h-4 w-4 text-ai-primary" />
          <CommandInput
            placeholder="Ask anything or type a command..."
            value={search}
            onValueChange={setSearch}
            className="border-0 focus:ring-0 flex-1"
          />
          {voiceSupported && (
            <Button
              size="sm"
              variant={isListening ? 'default' : 'ghost'}
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className="h-8 w-8 p-0"
            >
              {isListening ? (
                <MicOff className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Intent Detection Display */}
        {detectedIntent && (
          <div className="px-3 py-2 bg-ai-primary/10 border-b border-border">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-3 w-3 text-ai-primary" />
              <span className="text-muted-foreground">AI detected:</span>
              <Badge variant="outline" className="text-xs">
                {detectedIntent.intent.replace(/_/g, ' ')}
              </Badge>
              <span className="text-muted-foreground">
                ({detectedIntent.entities.join(', ')})
              </span>
            </div>
          </div>
        )}

        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Sparkles className="h-8 w-8 text-ai-primary opacity-50" />
              <p className="text-sm text-muted-foreground">
                No results found. Try a different query.
              </p>
            </div>
          </CommandEmpty>

          {/* AI Suggestions */}
          <CommandGroup heading="AI Suggestions">
            {filteredSuggestions
              .filter((s) => s.category === 'suggestion')
              .map((suggestion) => (
                <CommandItem
                  key={suggestion.id}
                  onSelect={suggestion.action}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  {suggestion.icon}
                  <span>{suggestion.label}</span>
                </CommandItem>
              ))}
          </CommandGroup>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                navigate('/projects/new');
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Create new project</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/invoices/new');
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            >
              <DollarSign className="h-4 w-4" />
              <span>Create new invoice</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate('/clients/new');
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            >
              <Users className="h-4 w-4" />
              <span>Add new client</span>
            </CommandItem>
          </CommandGroup>

          {/* Recent Commands */}
          <CommandGroup heading="Recent">
            <CommandItem className="flex items-center gap-3 px-4 py-3 cursor-pointer opacity-50">
              <Clock className="h-4 w-4" />
              <span>No recent commands</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
