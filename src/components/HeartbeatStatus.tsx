"use client";

import { useHeartbeat } from '@/hooks/useHeartbeat';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface HeartbeatStatusProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HeartbeatStatus({ 
  showText = false, 
  size = 'md',
  className = '' 
}: HeartbeatStatusProps) {
  const { status } = useHeartbeat({ autoStart: false }); // Don't auto-start, just listen

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          icon: Wifi,
          text: 'Online',
          textColor: 'text-green-600'
        };
      case 'offline':
        return {
          color: 'bg-gray-400',
          icon: WifiOff,
          text: 'Offline',
          textColor: 'text-gray-500'
        };
      case 'error':
        return {
          color: 'bg-red-500',
          icon: AlertTriangle,
          text: 'Error',
          textColor: 'text-red-600'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!showText) {
    // Simple dot indicator
    return (
      <motion.div
        className={`${sizeClasses[size]} ${config.color} rounded-full ${className}`}
        animate={{ 
          scale: status === 'online' ? [1, 1.2, 1] : 1,
          opacity: status === 'offline' ? [1, 0.5, 1] : 1
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        title={config.text}
      />
    );
  }

  // Full status with icon and text
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{ 
          scale: status === 'online' ? [1, 1.1, 1] : 1,
          rotate: status === 'error' ? [0, 5, -5, 0] : 0
        }}
        transition={{ 
          duration: status === 'error' ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Icon size={iconSize[size]} className={config.textColor} />
      </motion.div>
      
      {showText && (
        <span className={`text-${size} ${config.textColor} font-medium`}>
          {config.text}
        </span>
      )}
    </div>
  );
}

export default HeartbeatStatus;
