
import React from 'react';
import { SpinnerIcon } from './Icons';

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <SpinnerIcon />
      <p className="mt-4 text-lg text-gray-300 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
