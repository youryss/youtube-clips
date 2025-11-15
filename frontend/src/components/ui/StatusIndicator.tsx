import React from 'react';
import Badge from './Badge';

interface StatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
    completed: { variant: 'success', label: 'Completed' },
    success: { variant: 'success', label: 'Success' },
    processing: { variant: 'info', label: 'Processing' },
    downloading: { variant: 'info', label: 'Downloading' },
    transcribing: { variant: 'info', label: 'Transcribing' },
    analyzing: { variant: 'info', label: 'Analyzing' },
    slicing: { variant: 'info', label: 'Slicing' },
    failed: { variant: 'error', label: 'Failed' },
    error: { variant: 'error', label: 'Error' },
    pending: { variant: 'warning', label: 'Pending' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
  };

  const config = statusConfig[status.toLowerCase()] || { 
    variant: 'neutral' as const, 
    label: status 
  };

  return (
    <Badge 
      variant={config.variant} 
      size={size}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

export default StatusIndicator;

