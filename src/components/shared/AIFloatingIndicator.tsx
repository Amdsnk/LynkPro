import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AIFloatingIndicator() {
  const [isVisible, setIsVisible] = useState(true);
  const [tips, setTips] = useState([
    'Try voice commands: Press the microphone icon in the command bar',
    'Use Cmd+K to open the AI command palette',
    'Click "Simulate" on any project to test scenarios',
    'Zoom controls let you navigate between detail levels',
    'AI recommendations update in real-time based on your data',
  ]);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [tips.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-ai-primary/10 shadow-2xl max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-ai-primary flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold text-sm">AI Assistant</p>
                <Badge variant="default" className="text-xs animate-pulse">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 {tips[currentTip]}
              </p>
              <div className="flex items-center gap-1 mt-3">
                {tips.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-1 rounded-full transition-all duration-300',
                      index === currentTip ? 'w-6 bg-primary' : 'w-1 bg-primary/30'
                    )}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
