import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/useRealtimeConnection';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionStatusIndicator({ status, className = '' }: ConnectionStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Connected',
          pulse: false,
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'Reconnecting',
          pulse: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          label: 'Disconnected',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Don't show indicator when connected (minimal UI)
  if (status === 'connected') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${className}`}
    >
      <motion.div
        animate={config.pulse ? { rotate: 360 } : {}}
        transition={config.pulse ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      </motion.div>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </motion.div>
  );
}

// Minimal dot indicator for subtle display
interface ConnectionDotProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionDot({ status, className = '' }: ConnectionDotProps) {
  const getColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`h-2 w-2 rounded-full ${getColor()}`} />
      {status === 'connected' && (
        <motion.div
          className="absolute inset-0 h-2 w-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}
