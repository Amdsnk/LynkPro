import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ZoomLevel = 'overview' | 'detail' | 'deep' | 'atomic';

export interface ZoomState {
  level: ZoomLevel;
  targetId: string | null;
  targetType: 'project' | 'invoice' | 'client' | 'task' | null;
  history: Array<{ level: ZoomLevel; targetId: string | null; targetType: 'project' | 'invoice' | 'client' | 'task' | null }>;
}

interface ZoomContextValue {
  zoomState: ZoomState;
  zoomTo: (level: ZoomLevel, targetId?: string, targetType?: ZoomState['targetType']) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomBack: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canZoomBack: boolean;
}

const ZoomContext = createContext<ZoomContextValue | undefined>(undefined);

const zoomLevels: ZoomLevel[] = ['overview', 'detail', 'deep', 'atomic'];

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [zoomState, setZoomState] = useState<ZoomState>({
    level: 'overview',
    targetId: null,
    targetType: null,
    history: [],
  });

  const zoomTo = useCallback((level: ZoomLevel, targetId?: string, targetType?: ZoomState['targetType']) => {
    setZoomState((prev) => ({
      level,
      targetId: targetId || null,
      targetType: targetType || null,
      history: [...prev.history, { level: prev.level, targetId: prev.targetId, targetType: prev.targetType }],
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => {
      const currentIndex = zoomLevels.indexOf(prev.level);
      if (currentIndex < zoomLevels.length - 1) {
        const newLevel = zoomLevels[currentIndex + 1];
        return {
          ...prev,
          level: newLevel,
          history: [...prev.history, { level: prev.level, targetId: prev.targetId, targetType: prev.targetType }],
        };
      }
      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => {
      const currentIndex = zoomLevels.indexOf(prev.level);
      if (currentIndex > 0) {
        const newLevel = zoomLevels[currentIndex - 1];
        return {
          ...prev,
          level: newLevel,
          targetId: null,
          history: [...prev.history, { level: prev.level, targetId: prev.targetId, targetType: prev.targetType }],
        };
      }
      return prev;
    });
  }, []);

  const zoomBack = useCallback(() => {
    setZoomState((prev) => {
      if (prev.history.length > 0) {
        const previous = prev.history[prev.history.length - 1];
        return {
          level: previous.level,
          targetId: previous.targetId,
          targetType: previous.targetType,
          history: prev.history.slice(0, -1),
        };
      }
      return prev;
    });
  }, []);

  const currentIndex = zoomLevels.indexOf(zoomState.level);
  const canZoomIn = currentIndex < zoomLevels.length - 1;
  const canZoomOut = currentIndex > 0;
  const canZoomBack = zoomState.history.length > 0;

  return (
    <ZoomContext.Provider
      value={{
        zoomState,
        zoomTo,
        zoomIn,
        zoomOut,
        zoomBack,
        canZoomIn,
        canZoomOut,
        canZoomBack,
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoom must be used within ZoomProvider');
  }
  return context;
}
