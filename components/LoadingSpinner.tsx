import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-4',
  };
  
  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} border-solid border-yellow-400 border-t-transparent`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;