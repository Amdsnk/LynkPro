import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useZoom } from '@/contexts/ZoomContext';
import { ZoomIn, ZoomOut, ArrowLeft, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomControlsProps {
  className?: string;
  showLevel?: boolean;
}

export function ZoomControls({ className, showLevel = true }: ZoomControlsProps) {
  const { zoomState, zoomIn, zoomOut, zoomBack, canZoomIn, canZoomOut, canZoomBack } = useZoom();

  const levelLabels = {
    overview: 'Overview',
    detail: 'Detail',
    deep: 'Deep Dive',
    atomic: 'Atomic',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Zoom Level Indicator */}
      {showLevel && (
        <Badge variant="outline" className="gap-1.5">
          <Maximize2 className="h-3 w-3" />
          {levelLabels[zoomState.level]}
        </Badge>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={zoomBack}
          disabled={!canZoomBack}
          className="h-7 w-7 p-0"
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border" />

        <Button
          size="sm"
          variant="ghost"
          onClick={zoomOut}
          disabled={!canZoomOut}
          className="h-7 w-7 p-0"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={zoomIn}
          disabled={!canZoomIn}
          className="h-7 w-7 p-0"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
