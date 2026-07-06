import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
);